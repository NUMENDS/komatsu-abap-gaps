import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { lstat, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
const RESOURCE_URI = "ui://komatsu-factory-wizard/main";
const SERVER_DIR = path.dirname(fileURLToPath(import.meta.url));
const QuestionSchema = z.object({
    id: z.string(),
    label: z.string(),
    details: z.string().optional(),
    answer: z.string().optional(),
    kind: z.enum(["text", "textarea", "boolean", "select"]).default("textarea"),
    required: z.boolean().default(false),
    options: z.array(z.string()).optional()
});
const ActionSchema = z.object({
    id: z.string(),
    label: z.string(),
    description: z.string().optional(),
    requiresConfirmation: z.boolean().default(false)
});
const JiraCardSchema = z.object({
    key: z.string(),
    summary: z.string(),
    issueType: z.string().optional(),
    status: z.string().optional(),
    assignee: z.string().optional(),
    url: z.string().url().optional()
});
const JiraEpicSchema = z.object({
    key: z.string(),
    summary: z.string(),
    issueType: z.string().optional(),
    id: z.string().optional(),
    status: z.string().optional(),
    assignee: z.string().optional(),
    url: z.string().url().optional()
});
const ValidationMessageSchema = z.object({
    field: z.string().optional(),
    message: z.string(),
    severity: z.enum(["error", "warning", "info"]).default("error"),
    blocking: z.boolean().default(true),
    source: z.string().optional()
});
const FindingSchema = z.object({
    label: z.string(),
    value: z.string().optional(),
    status: z.enum(["confirmed", "missing", "uncertain"]),
    source: z.string().optional()
});
/*
 * Este objeto vem do agente, que consulta AGENTS.md e o estado real
 * do factory_orchestrator. O frontend só apresenta esses dados.
 */
const WorkflowContextSchema = z.object({
    summary: z.string().optional(),
    currentStage: z.string().optional(),
    phase: z.enum(["documents", "analysis", "plan_review", "execution"]).optional(),
    dependencies: z.array(z.string()).default([]),
    questions: z.array(QuestionSchema).default([]),
    availableActions: z.array(ActionSchema).default([]),
    jiraCards: z.array(JiraCardSchema).optional(),
    jiraEpics: z.array(JiraEpicSchema).optional(),
    jiraLookup: z.object({
        query: z.string(),
        key: z.string().optional(),
        summary: z.string().optional(),
        issueType: z.string().optional(),
        id: z.string().optional(),
        status: z.string().optional(),
        assignee: z.string().optional(),
        url: z.string().url().optional(),
        error: z.string().optional()
    }).optional(),
    validationMessages: z.array(ValidationMessageSchema).default([]),
    findings: z.array(FindingSchema).default([]),
    planMarkdown: z.string().optional(),
    planPath: z.string().optional(),
    planApproved: z.boolean().optional(),
    answers: z.record(z.string(), z.string()).optional()
});
const OpenWizardSchema = z.object({
    mode: z.enum(["new", "continue"]).default("new"),
    gapId: z.string().optional(),
    workflow: WorkflowContextSchema.optional()
});
const LoadGapContextSchema = z.object({
    gapId: z.string().min(1)
});
async function listFiles(directory, relativeTo, depth = 0) {
    if (depth > 4)
        return [];
    let entries;
    try {
        entries = await readdir(directory, { withFileTypes: true });
    }
    catch {
        return [];
    }
    const files = [];
    for (const entry of entries) {
        // Não segue links simbólicos durante o inventário.
        if (entry.isSymbolicLink() || entry.name.startsWith("."))
            continue;
        const absolutePath = path.join(directory, entry.name);
        if (entry.isFile()) {
            files.push(path.relative(relativeTo, absolutePath).split(path.sep).join("/"));
        }
        else if (entry.isDirectory()) {
            files.push(...await listFiles(absolutePath, relativeTo, depth + 1));
        }
    }
    return files.sort();
}
async function readIfExists(filePath) {
    try {
        return await readFile(filePath, "utf8");
    }
    catch {
        return "";
    }
}
function parseQuestionSections(markdown) {
    const headings = Array.from(markdown.matchAll(/^##\s+Q(\d+)\s*[—–:-]\s*(.+)$/gim));
    return headings.map((heading, index) => {
        const start = (heading.index ?? 0) + heading[0].length;
        const end = headings[index + 1]?.index ?? markdown.length;
        const details = markdown.slice(start, end).trim();
        return {
            id: `q${heading[1]}`,
            label: heading[2].trim(),
            details,
            required: /Decisão necessária/i.test(details)
        };
    });
}
function parseQuestionAnswers(markdown) {
    const headings = Array.from(markdown.matchAll(/^##\s+Q(\d+)(?:\s*[—–:-]\s*.*)?$/gim));
    return Object.fromEntries(headings.map((heading, index) => {
        const start = (heading.index ?? 0) + heading[0].length;
        const end = headings[index + 1]?.index ?? markdown.length;
        return [`q${heading[1]}`, markdown.slice(start, end).trim()];
    }).filter(([, answer]) => Boolean(answer)));
}
async function readGapSummary(workspaceRoot, projectsDirectory, directoryName, includePlan = false) {
    const gapDirectory = path.join(projectsDirectory, directoryName);
    const gapJsonPath = path.join(gapDirectory, "gap.json");
    let gapJson;
    try {
        gapJson = JSON.parse(await readFile(gapJsonPath, "utf8"));
    }
    catch {
        return null;
    }
    const rawSpecAnswers = gapJson.spec_answers;
    const jsonAnswers = rawSpecAnswers && typeof rawSpecAnswers === "object" && !Array.isArray(rawSpecAnswers)
        ? Object.fromEntries(Object.entries(rawSpecAnswers).filter((entry) => typeof entry[1] === "string"))
        : {};
    const analysisDirectory = path.join(gapDirectory, "01_analise");
    const [questionsMarkdown, answersMarkdown] = await Promise.all([
        readIfExists(path.join(analysisDirectory, "perguntas.md")),
        readIfExists(path.join(analysisDirectory, "respostas.md"))
    ]);
    const parsedQuestions = parseQuestionSections(questionsMarkdown);
    const questionAnswers = parseQuestionAnswers(answersMarkdown);
    const specAnswers = { ...jsonAnswers, ...questionAnswers };
    const analysisQuestions = parsedQuestions.map((question) => ({
        ...question,
        answer: specAnswers[question.id],
        kind: "textarea"
    }));
    const rawStages = gapJson.stages;
    const stages = rawStages && typeof rawStages === "object"
        ? Object.entries(rawStages).map(([number, value]) => {
            const stage = value && typeof value === "object"
                ? value
                : {};
            return {
                number,
                name: String(stage.name ?? `Etapa ${number}`),
                status: String(stage.status ?? "desconhecido")
            };
        })
        : [];
    const documents = await listFiles(gapDirectory, workspaceRoot);
    const jiraReferencePath = path.join(gapDirectory, "jira-reference.json");
    let jiraEpic = null;
    let planApproved = null;
    try {
        const reference = JSON.parse(await readFile(jiraReferencePath, "utf8"));
        const key = reference.jira?.epic_key;
        if (typeof reference.plan?.approved === "boolean") {
            planApproved = reference.plan.approved;
        }
        if (typeof key === "string" && key.trim()) {
            const baseUrl = typeof reference.jira?.base_url === "string"
                ? reference.jira.base_url.replace(/\/$/, "")
                : null;
            jiraEpic = {
                key,
                summary: null,
                url: baseUrl ? `${baseUrl}/browse/${encodeURIComponent(key)}` : null
            };
        }
    }
    catch {
        // GAPs sem referência Jira continuam selecionáveis.
    }
    let planMarkdown = null;
    if (includePlan) {
        const planPath = path.join(gapDirectory, "01_analise", "DEVELOPMENT_PLAN.md");
        try {
            planMarkdown = await readFile(planPath, "utf8");
        }
        catch {
            // Plano ainda não gerado.
        }
    }
    return {
        gapId: String(gapJson.gap_id ?? directoryName.split("__")[0]),
        slug: String(gapJson.slug ?? directoryName.split("__").slice(1).join("__")),
        relativePath: path
            .relative(workspaceRoot, gapDirectory)
            .split(path.sep)
            .join("/"),
        status: typeof gapJson.status === "string" ? gapJson.status : null,
        currentStage: typeof gapJson.current_stage === "number"
            ? gapJson.current_stage
            : null,
        specPath: typeof gapJson.spec_path === "string" ? gapJson.spec_path : null,
        jiraEpic,
        planMarkdown,
        planApproved,
        specAnswers,
        analysisQuestions,
        stages: stages.sort((a, b) => Number(a.number) - Number(b.number)),
        documents
    };
}
async function discoverGaps(workspaceRoot) {
    const projectsDirectory = path.join(workspaceRoot, "KOMATSU", "projetos");
    let entries;
    try {
        entries = await readdir(projectsDirectory, { withFileTypes: true });
    }
    catch {
        return [];
    }
    const gaps = [];
    for (const entry of entries) {
        if (!entry.isDirectory() ||
            entry.isSymbolicLink() ||
            !entry.name.includes("__")) {
            continue;
        }
        const gap = await readGapSummary(workspaceRoot, projectsDirectory, entry.name);
        if (gap)
            gaps.push(gap);
    }
    return gaps.sort((a, b) => a.gapId.localeCompare(b.gapId));
}
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_TOTAL_BYTES = 25 * 1024 * 1024;
const UploadedFileSchema = z.object({
    name: z.string().min(1).max(255),
    mimeType: z.string().max(150).default("application/octet-stream"),
    base64: z.string().min(1).max(15_000_000),
    primary: z.boolean().default(false),
    role: z.enum([
        "functional_spec",
        "technical_spec",
        "supporting"
    ]).default("supporting")
});
const StageDocumentsSchema = z.object({
    intent: z.enum(["intake", "replacement"]).default("intake"),
    files: z.array(UploadedFileSchema).min(1).max(10)
});
const SaveJiraReferenceSchema = z.object({
    gapId: z.string().min(1),
    epicKey: z.string().regex(/^[A-Z][A-Z0-9_]*-\d+$/i),
    epicId: z.string().optional(),
    summary: z.string().optional(),
    url: z.string().url().optional(),
    issueType: z.string()
});
const ALLOWED_EXTENSIONS = new Set([
    ".docx",
    ".pdf",
    ".xlsx",
    ".csv",
    ".tsv",
    ".md",
    ".txt",
    ".png",
    ".jpg",
    ".jpeg"
]);
function sanitizeFileName(input) {
    const normalized = input.replaceAll("\\", "/");
    const baseName = normalized.split("/").pop() ?? "";
    const safeName = baseName
        .replace(/[<>:"|?*\u0000-\u001F]/g, "_")
        .trim();
    if (!safeName || safeName === "." || safeName === "..") {
        throw new Error("Nome de arquivo inválido.");
    }
    const extension = path.extname(safeName).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(extension)) {
        throw new Error(`Tipo de arquivo não permitido: ${extension || "sem extensão"}`);
    }
    return safeName;
}
export function createServer(workspaceRoot) {
    const resolvedWorkspaceRoot = path.resolve(workspaceRoot);
    const server = new McpServer({
        name: "Komatsu Factory Wizard",
        version: "0.1.0"
    });
    registerAppTool(server, "open_factory_wizard", {
        title: "Abrir Factory Wizard",
        description: "Abre o wizard e apresenta GAPs e documentos presentes no workspace. " +
            "O status, as perguntas e as ações do fluxo são fornecidos pelo agente.",
        inputSchema: OpenWizardSchema,
        annotations: {
            readOnlyHint: true
        },
        _meta: {
            ui: {
                resourceUri: RESOURCE_URI
            }
        }
    }, async ({ mode, gapId, workflow }) => {
        let gaps = await discoverGaps(resolvedWorkspaceRoot);
        // `new` is the explicit entry point used by /gap-init: always begin at
        // the choice screen, even if the chat happens to mention an open GAP.
        // A GAP is selected only when the caller explicitly resumes it.
        const selectedGap = mode === "continue" && gapId && gaps.some((gap) => gap.gapId === gapId)
            ? gapId
            : null;
        if (selectedGap) {
            const selectedSummary = gaps.find((gap) => gap.gapId === selectedGap);
            if (selectedSummary) {
                const selectedDirectory = path.basename(selectedSummary.relativePath);
                const detailedSummary = await readGapSummary(resolvedWorkspaceRoot, path.join(resolvedWorkspaceRoot, "KOMATSU", "projetos"), selectedDirectory, true);
                if (detailedSummary) {
                    gaps = gaps.map((gap) => gap.gapId === selectedGap ? detailedSummary : gap);
                }
            }
        }
        const selectedSummary = selectedGap
            ? gaps.find((gap) => gap.gapId === selectedGap)
            : undefined;
        const workflowState = {
            dependencies: [],
            questions: [],
            availableActions: [],
            ...workflow,
            answers: {
                ...selectedSummary?.specAnswers,
                ...workflow?.answers
            },
            planMarkdown: workflow?.planMarkdown ?? selectedSummary?.planMarkdown ?? undefined,
            planApproved: workflow?.planApproved ?? selectedSummary?.planApproved ?? undefined
        };
        const state = {
            mode,
            gaps,
            selectedGapId: selectedGap,
            workflow: workflowState
        };
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(state, null, 2)
                }
            ],
            structuredContent: state
        };
    });
    registerAppTool(server, "load_factory_gap_context", {
        title: "Carregar contexto local do GAP",
        description: "Lê os artefatos existentes de um GAP para preencher o wizard sem enviar mensagem ao agente.",
        inputSchema: LoadGapContextSchema,
        annotations: { readOnlyHint: true },
        _meta: {
            ui: {
                resourceUri: RESOURCE_URI,
                visibility: ["app"]
            }
        }
    }, async ({ gapId }) => {
        const gaps = await discoverGaps(resolvedWorkspaceRoot);
        const matches = gaps.filter((gap) => gap.gapId === gapId);
        if (matches.length !== 1) {
            throw new Error(`Não foi possível localizar um único GAP para ${gapId}.`);
        }
        const summary = await readGapSummary(resolvedWorkspaceRoot, path.join(resolvedWorkspaceRoot, "KOMATSU", "projetos"), path.basename(matches[0].relativePath), true);
        if (!summary)
            throw new Error(`Não foi possível ler os artefatos de ${gapId}.`);
        const detailedGaps = gaps.map((gap) => gap.gapId === gapId ? summary : gap);
        const currentStage = summary.currentStage ?? 1;
        const phase = currentStage > 1
            ? "execution"
            : summary.analysisQuestions.length || Object.keys(summary.specAnswers).length
                ? "analysis"
                : summary.planMarkdown
                    ? "plan_review"
                    : "documents";
        const state = {
            mode: "continue",
            gaps: detailedGaps,
            selectedGapId: gapId,
            workflow: {
                currentStage: String(currentStage),
                phase,
                dependencies: [],
                questions: summary.analysisQuestions,
                availableActions: [],
                validationMessages: [],
                findings: [],
                answers: summary.specAnswers,
                planMarkdown: summary.planMarkdown ?? undefined,
                planApproved: summary.planApproved ?? undefined
            }
        };
        return {
            content: [{ type: "text", text: JSON.stringify(state, null, 2) }],
            structuredContent: state
        };
    });
    registerAppTool(server, "stage_factory_documents", {
        title: "Receber documentos do Factory Wizard",
        description: "Grava a EF e os anexos enviados pelo wizard na área local ignorada pelo Git.",
        inputSchema: StageDocumentsSchema,
        _meta: {
            ui: {
                resourceUri: RESOURCE_URI,
                visibility: ["app"]
            }
        }
    }, async ({ files, intent }) => {
        const primaryFiles = files.filter((file) => file.primary);
        if (intent === "intake" && primaryFiles.length !== 1) {
            throw new Error("Envie exatamente uma especificação funcional principal.");
        }
        if (intent === "replacement" && primaryFiles.length > 1) {
            throw new Error("Na substituição, selecione no máximo uma especificação funcional.");
        }
        const uploadId = randomUUID();
        const stagingDirectory = path.join(resolvedWorkspaceRoot, "KOMATSU", "EF", ".factory-wizard-staging", uploadId);
        await mkdir(stagingDirectory, { recursive: true });
        let totalBytes = 0;
        const savedFiles = [];
        for (const file of files) {
            const safeName = sanitizeFileName(file.name);
            const extension = path.extname(safeName).toLowerCase();
            if (file.role !== "supporting" &&
                ![".docx", ".pdf"].includes(extension)) {
                throw new Error(`${safeName}: especificações funcionais e técnicas devem estar em DOCX ou PDF.`);
            }
            if (!/^[A-Za-z0-9+/]*={0,2}$/.test(file.base64)) {
                throw new Error(`Conteúdo inválido no arquivo ${safeName}.`);
            }
            const bytes = Buffer.from(file.base64, "base64");
            if (bytes.length === 0 || bytes.length > MAX_FILE_BYTES) {
                throw new Error(`${safeName} está vazio ou ultrapassa o limite de 10 MB.`);
            }
            if (bytes.toString("base64") !== file.base64) {
                throw new Error(`Codificação Base64 inválida no arquivo ${safeName}.`);
            }
            totalBytes += bytes.length;
            if (totalBytes > MAX_TOTAL_BYTES) {
                throw new Error("O tamanho total dos arquivos ultrapassa 25 MB.");
            }
            const destination = path.join(stagingDirectory, safeName);
            await writeFile(destination, bytes, { flag: "wx" });
            savedFiles.push({
                name: safeName,
                relativePath: path
                    .relative(resolvedWorkspaceRoot, destination)
                    .split(path.sep)
                    .join("/"),
                sizeBytes: bytes.length,
                mimeType: file.mimeType,
                primary: file.primary,
                role: file.role
            });
        }
        const receipt = {
            uploadId,
            intent,
            primarySpecPath: savedFiles.find((file) => file.primary)?.relativePath,
            files: savedFiles
        };
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(receipt, null, 2)
                }
            ],
            structuredContent: receipt
        };
    });
    registerAppResource(server, "Komatsu Factory Wizard UI", RESOURCE_URI, {
        mimeType: RESOURCE_MIME_TYPE
    }, async () => {
        const html = await readFile(path.join(SERVER_DIR, "mcp-app.html"), "utf8");
        return {
            contents: [
                {
                    uri: RESOURCE_URI,
                    mimeType: RESOURCE_MIME_TYPE,
                    text: html
                }
            ]
        };
    });
    registerAppTool(server, "save_factory_jira_reference", {
        title: "Salvar referência do épico no GAP",
        description: "Registra em jira-reference.json o épico confirmado e escolhido pelo usuário. Não altera o Jira.",
        inputSchema: SaveJiraReferenceSchema,
        _meta: {
            ui: {
                resourceUri: RESOURCE_URI,
                visibility: ["app", "model"]
            }
        }
    }, async ({ gapId, epicKey, epicId, summary, url, issueType }) => {
        if (!["epic", "épico"].includes(issueType.trim().toLocaleLowerCase("pt-BR"))) {
            throw new Error("A referência só pode ser salva quando o Jira confirmar que o item é um Epic/Épico.");
        }
        const gaps = await discoverGaps(resolvedWorkspaceRoot);
        const matches = gaps.filter((gap) => gap.gapId === gapId);
        if (matches.length !== 1) {
            throw new Error(`Não foi possível localizar um único GAP existente para ${gapId}. Nenhum arquivo foi alterado.`);
        }
        const projectsDirectory = path.join(resolvedWorkspaceRoot, "KOMATSU", "projetos");
        const gapDirectory = path.resolve(projectsDirectory, path.basename(matches[0].relativePath));
        const projectsPrefix = `${path.resolve(projectsDirectory)}${path.sep}`;
        if (!gapDirectory.startsWith(projectsPrefix)) {
            throw new Error("O caminho do GAP está fora de KOMATSU/projetos.");
        }
        const referencePath = path.join(gapDirectory, "jira-reference.json");
        try {
            const referenceStat = await lstat(referencePath);
            if (referenceStat.isSymbolicLink() || !referenceStat.isFile()) {
                throw new Error("jira-reference.json deve ser um arquivo regular, não um link simbólico.");
            }
        }
        catch (failure) {
            if (failure.code !== "ENOENT")
                throw failure;
        }
        let existing = {};
        try {
            const raw = JSON.parse(await readFile(referencePath, "utf8"));
            if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
                throw new Error("jira-reference.json não contém um objeto JSON.");
            }
            existing = raw;
        }
        catch (failure) {
            if (failure.code !== "ENOENT")
                throw failure;
        }
        const existingJira = existing.jira && typeof existing.jira === "object"
            ? existing.jira
            : {};
        const existingPlan = existing.plan && typeof existing.plan === "object"
            ? existing.plan
            : { source: null, fingerprint: null, approved: false };
        let baseUrl = typeof existingJira.base_url === "string"
            ? existingJira.base_url
            : null;
        if (url) {
            const epicUrl = new URL(url);
            const jiraPath = decodeURIComponent(epicUrl.pathname);
            const browseIndex = jiraPath.lastIndexOf("/browse/");
            const urlKey = browseIndex >= 0 ? jiraPath.slice(browseIndex + "/browse/".length).replace(/\/$/, "") : "";
            if (urlKey !== epicKey) {
                throw new Error("A URL do Jira não corresponde à chave do épico selecionado.");
            }
            baseUrl = `${epicUrl.origin}${jiraPath.slice(0, browseIndex)}`;
        }
        if (!baseUrl)
            throw new Error("O Jira não retornou a URL-base necessária para gravar a referência local.");
        const projectKey = epicKey.split("-")[0];
        const nextReference = {
            ...existing,
            schema_version: typeof existing.schema_version === "number" ? existing.schema_version : 1,
            gap: gapId,
            jira: {
                ...existingJira,
                base_url: baseUrl || existingJira.base_url || null,
                epic_key: epicKey,
                epic_id: epicId ?? (existingJira.epic_key === epicKey ? existingJira.epic_id ?? null : null),
                project_key: typeof existingJira.project_key === "string" && existingJira.epic_key === epicKey
                    ? existingJira.project_key
                    : projectKey
            },
            plan: existingPlan,
            last_successful_sync_at: existing.last_successful_sync_at ?? null,
            stories: Array.isArray(existing.stories) ? existing.stories : [],
            conflicts: Array.isArray(existing.conflicts) ? existing.conflicts : []
        };
        await writeFile(referencePath, `${JSON.stringify(nextReference, null, 2)}\n`, "utf8");
        const receipt = { gapId, epicKey, summary, url: url ?? `${baseUrl}/browse/${encodeURIComponent(epicKey)}`, referencePath: path.relative(resolvedWorkspaceRoot, referencePath).split(path.sep).join("/") };
        return {
            content: [{ type: "text", text: JSON.stringify(receipt, null, 2) }],
            structuredContent: receipt
        };
    });
    return server;
}
