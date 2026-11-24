import { useApp } from "@modelcontextprotocol/ext-apps/react";
import type { CallToolResult } from "@modelcontextprotocol/client";
import { StrictMode, useMemo, useRef, useState } from "react";
import type { CSSProperties, DragEvent } from "react";
import { createRoot } from "react-dom/client";

type Question = {
  id: string;
  label: string;
  details?: string;
  answer?: string;
  kind: "text" | "textarea" | "boolean" | "select";
  required: boolean;
  options?: string[];
};

type Action = {
  id: string;
  label: string;
  description?: string;
  requiresConfirmation: boolean;
};

type JiraEpic = {
  key: string;
  summary: string;
  issueType?: string;
  id?: string;
  status?: string;
  assignee?: string;
  url?: string;
};

type ValidationMessage = {
  field?: string;
  message: string;
  severity: "error" | "warning" | "info";
  blocking: boolean;
  source?: string;
};

type Finding = {
  label: string;
  value?: string;
  status: "confirmed" | "missing" | "uncertain";
  source?: string;
};

type Gap = {
  gapId: string;
  slug: string;
  relativePath: string;
  status: string | null;
  currentStage: number | null;
  specPath: string | null;
  jiraEpic: { key: string; summary: string | null; url: string | null } | null;
  planMarkdown: string | null;
  planApproved: boolean | null;
  specAnswers?: Record<string, string>;
  stages: Array<{ number: string; name: string; status: string }>;
  documents: string[];
};

type Phase = "documents" | "analysis" | "plan_review" | "execution";
type Screen = "start" | "documents" | "analysis" | "plan_review" | "execution";

type WizardState = {
  mode: "new" | "continue";
  gaps: Gap[];
  selectedGapId: string | null;
  workflow: {
    summary?: string;
    currentStage?: string;
    phase?: Phase;
    dependencies: string[];
    questions: Question[];
    availableActions: Action[];
    jiraCards?: JiraEpic[];
    jiraEpics?: JiraEpic[];
    jiraLookup?: {
      query: string;
      key?: string;
      summary?: string;
      issueType?: string;
      id?: string;
      status?: string;
      assignee?: string;
      url?: string;
      error?: string;
    };
    validationMessages: ValidationMessage[];
    findings: Finding[];
    planMarkdown?: string;
    planPath?: string;
    planApproved?: boolean;
    answers?: Record<string, string>;
  };
};

type StagedFile = {
  name: string;
  relativePath: string;
  sizeBytes: number;
  mimeType: string;
  primary: boolean;
  role: "functional_spec" | "technical_spec" | "supporting";
};

type ThemeColors = {
  background: string;
  surface: string;
  surfaceRaised: string;
  text: string;
  muted: string;
  border: string;
  accent: string;
  accentText: string;
  danger: string;
  success: string;
  warning: string;
};

function decodeWizardState(result: CallToolResult): WizardState | null {
  let value: unknown = result.structuredContent;
  if (!value) {
    const textBlock = result.content.find((item) => item.type === "text");
    if (!textBlock || textBlock.type !== "text") return null;
    try {
      value = JSON.parse(textBlock.text);
    } catch {
      return null;
    }
  }

  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<WizardState>;
  if (!Array.isArray(raw.gaps) || !raw.workflow) return null;

  return {
    ...raw,
    mode: raw.mode === "continue" ? "continue" : "new",
    selectedGapId: raw.selectedGapId ?? null,
    workflow: {
      ...raw.workflow,
      dependencies: raw.workflow.dependencies ?? [],
      questions: raw.workflow.questions ?? [],
      availableActions: raw.workflow.availableActions ?? [],
      validationMessages: raw.workflow.validationMessages ?? [],
      findings: raw.workflow.findings ?? [],
      answers: raw.workflow.answers ?? Object.fromEntries(
        (raw.workflow.questions ?? [])
          .filter((question) => question.answer !== undefined)
          .map((question) => [question.id, question.answer!])
      )
    }
  } as WizardState;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Falha ao ler ${file.name}.`));
    reader.onload = () => {
      const result = String(reader.result);
      const comma = result.indexOf(",");
      if (comma < 0) {
        reject(new Error(`Não foi possível preparar ${file.name}.`));
        return;
      }
      resolve(result.slice(comma + 1));
    };
    reader.readAsDataURL(file);
  });
}

function isEpic(issueType?: string): boolean {
  return issueType?.trim().toLocaleLowerCase("pt-BR") === "epic" ||
    issueType?.trim().toLocaleLowerCase("pt-BR") === "épico";
}

function capitalizeInitial(text: string): string {
  return text.replace(/^(\s*)(\p{L})/u, (_match, spacing: string, letter: string) =>
    `${spacing}${letter.toLocaleUpperCase("pt-BR")}`
  );
}

type StageProgress = "completed" | "inProgress" | "pending";

function stageProgress(status: string): StageProgress {
  const normalized = status.normalize("NFD").replace(/\p{Diacritic}/gu, "").trim().toLocaleLowerCase("pt-BR").replace(/[\s-]+/g, "_");
  if (["concluido", "concluida", "completed", "complete", "done", "finalizado", "finalizada"].includes(normalized)) return "completed";
  if (["em_andamento", "in_progress", "ongoing", "em_execucao", "in_execution"].includes(normalized)) return "inProgress";
  return "pending";
}

function stageProgressLabel(progress: StageProgress): string {
  if (progress === "completed") return "Concluído";
  if (progress === "inProgress") return "Em andamento";
  return "Pendente";
}

function phaseToScreen(phase?: Phase): Screen {
  if (phase === "analysis") return "analysis";
  if (phase === "plan_review") return "plan_review";
  if (phase === "execution") return "execution";
  return "documents";
}

function restoredScreen(state: WizardState): Screen {
  const selectedGap = state.gaps.find((gap) => gap.gapId === state.selectedGapId);
  if ((selectedGap?.currentStage ?? 0) <= 1 && state.workflow.phase === "analysis") return "documents";
  if (state.workflow.phase) return phaseToScreen(state.workflow.phase);
  if (state.workflow.questions.length) return "analysis";
  if ((selectedGap?.currentStage ?? 0) > 1) return "execution";
  if (state.workflow.planMarkdown || selectedGap?.planMarkdown) return "plan_review";
  if (Object.keys(state.workflow.answers ?? {}).length) return "analysis";
  if (selectedGap?.specAnswers && Object.keys(selectedGap.specAnswers).length) return "analysis";
  return selectedGap ? "documents" : "start";
}

function FactoryWizard() {
  const [state, setState] = useState<WizardState | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [screen, setScreen] = useState<Screen>("start");
  const [workMode, setWorkMode] = useState<"new" | "continue">("new");
  const [selectedGapId, setSelectedGapId] = useState("");
  const [primaryFile, setPrimaryFile] = useState<File | null>(null);
  const [technicalFile, setTechnicalFile] = useState<File | null>(null);
  const [supportingFiles, setSupportingFiles] = useState<File[]>([]);
  const [replaceDocuments, setReplaceDocuments] = useState(false);
  const [replaceEpic, setReplaceEpic] = useState(false);
  const [selectedEpicKey, setSelectedEpicKey] = useState("");
  const [epicQuery, setEpicQuery] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [savedAnswers, setSavedAnswers] = useState<Record<string, string>>({});
  const [confirmations, setConfirmations] = useState<Record<string, boolean>>({});
  const [approvalConfirmed, setApprovalConfirmed] = useState(false);
  const [planChangeRequest, setPlanChangeRequest] = useState("");
  const [busy, setBusy] = useState(false);
  const [waitingForAgent, setWaitingForAgent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const pendingDestination = useRef<"auto" | "documents" | "resume-gap" | "new-flow" | "answers-saved" | null>(null);
  const lastGapId = useRef<string | null>(null);

  const { app, error } = useApp({
    appInfo: { name: "Komatsu Factory Wizard", version: "0.3.0" },
    capabilities: {},
    onAppCreated: (createdApp) => {
      const initialTheme = createdApp.getHostContext()?.theme;
      if (initialTheme === "light" || initialTheme === "dark") setTheme(initialTheme);
      createdApp.onhostcontextchanged = (context) => {
        if (context.theme === "light" || context.theme === "dark") setTheme(context.theme);
      };
      createdApp.ontoolresult = (result) => {
        const nextState = decodeWizardState(result);
        if (!nextState) return;
        setState(nextState);
        const destination = pendingDestination.current;
        if (destination === "answers-saved") {
          const persistedAnswers = nextState.workflow.answers ?? {};
          setAnswers(persistedAnswers);
          setSavedAnswers(persistedAnswers);
        } else if (lastGapId.current === nextState.selectedGapId) {
          setAnswers((current) => ({ ...nextState.workflow.answers, ...current }));
        } else {
          const persistedAnswers = nextState.workflow.answers ?? {};
          setAnswers(persistedAnswers);
          setSavedAnswers(persistedAnswers);
        }
        lastGapId.current = nextState.selectedGapId;
        setWaitingForAgent(false);
        if (destination) {
          if (destination === "new-flow" && nextState.selectedGapId) {
            setSelectedGapId(nextState.selectedGapId);
            setWorkMode("continue");
          }
          setScreen(destination === "documents"
            ? "documents"
            : destination === "resume-gap" && nextState.workflow.phase === "analysis"
              ? "documents"
              : phaseToScreen(nextState.workflow.phase));
          pendingDestination.current = null;
        } else if (nextState.selectedGapId) {
          setSelectedGapId(nextState.selectedGapId);
          setWorkMode("continue");
          setScreen(restoredScreen(nextState));
        } else if (nextState.workflow.phase === "documents") {
          setWorkMode("new");
          setScreen("documents");
        } else {
          setScreen("start");
        }
      };
      createdApp.onerror = (appError) => console.error("Factory Wizard MCP App:", appError);
    }
  });

  const colors: ThemeColors = theme === "dark"
    ? {
        background: "#15181e", surface: "#20252d", surfaceRaised: "#292f39",
        text: "#f4f6fa", muted: "#bbc3cf", border: "#48515f", accent: "#f0b323",
        accentText: "#171717", danger: "#ffb4ab", success: "#8fe0ae", warning: "#ffd37a"
      }
    : {
        background: "#ffffff", surface: "#f5f7fa", surfaceRaised: "#ffffff",
        text: "#17202b", muted: "#526071", border: "#c7ced8", accent: "#d69b00",
        accentText: "#171717", danger: "#b42318", success: "#16803c", warning: "#936500"
      };

  const selectedGap = useMemo(
    () => state?.gaps.find((gap) => gap.gapId === selectedGapId) ?? null,
    [state, selectedGapId]
  );
  const answersDirty = Object.keys({ ...savedAnswers, ...answers }).some(
    (key) => (answers[key] ?? "") !== (savedAnswers[key] ?? "")
  );

  const jiraEpics = (state?.workflow.jiraEpics ?? state?.workflow.jiraCards ?? [])
    .filter((item) => isEpic(item.issueType));
  const lookup = state?.workflow.jiraLookup;
  const epicValidation = lookup?.error
    ? lookup.error
    : lookup?.key && !isEpic(lookup.issueType)
      ? `O item ${lookup.key} é uma ${lookup.issueType ?? "issue sem tipo confirmado"}, não um épico. Informe o link ou a chave de um épico.`
      : null;
  const serverBlockingMessages = state?.workflow.validationMessages.filter(
    (item) => item.blocking && item.severity === "error"
  ) ?? [];
  const planApproved = state?.workflow.planApproved ?? selectedGap?.planApproved ?? false;

  function resetDraft() {
    setPrimaryFile(null);
    setTechnicalFile(null);
    setSupportingFiles([]);
    setReplaceDocuments(false);
    setReplaceEpic(false);
    setSelectedEpicKey("");
    setEpicQuery("");
    setAnswers({});
    setSavedAnswers({});
    setConfirmations({});
    setApprovalConfirmed(false);
    setPlanChangeRequest("");
    setFieldErrors({});
    setErrorMessage(null);
  }

  function startNewGap() {
    resetDraft();
    setWorkMode("new");
    setSelectedGapId("");
    setScreen("documents");
    void loadAssignedEpics();
  }

  async function enterSelectedGap() {
    if (!selectedGap) {
      setErrorMessage("Selecione um GAP existente para continuar.");
      return;
    }
    setWorkMode("continue");
    resetDraft();
    setErrorMessage(null);
    setFieldErrors({});
    setSelectedEpicKey("");
    setBusy(true);
    try {
      const result = await app?.callServerTool({
        name: "load_factory_gap_context",
        arguments: { gapId: selectedGap.gapId }
      });
      if (!result || result.isError) {
        const detail = result?.content.find((item) => item.type === "text");
        throw new Error(detail?.type === "text" ? detail.text : "Não foi possível carregar o GAP.");
      }
      const nextState = decodeWizardState(result);
      if (!nextState) throw new Error("A tool não retornou um estado válido do GAP.");
      setState(nextState);
      setSelectedGapId(selectedGap.gapId);
      setWorkMode("continue");
      const persistedAnswers = nextState.workflow.answers ?? {};
      setAnswers(persistedAnswers);
      setSavedAnswers(persistedAnswers);
      lastGapId.current = selectedGap.gapId;
      setScreen(restoredScreen(nextState));
    } catch (failure) {
      setErrorMessage(failure instanceof Error ? failure.message : "Falha ao carregar o GAP.");
    } finally {
      setBusy(false);
    }
  }

  async function sendAgentMessage(message: string, destination: "auto" | "documents" | "resume-gap" | "new-flow" | "answers-saved" = "auto") {
    if (!app) return;
    setBusy(true);
    setErrorMessage(null);
    pendingDestination.current = destination;
    try {
      const result = await app.sendMessage({ role: "user", content: [{ type: "text", text: message }] });
      if (result.isError) throw new Error("O Cursor não aceitou a solicitação do wizard.");
      setWaitingForAgent(true);
    } catch (failure) {
      pendingDestination.current = null;
      setErrorMessage(failure instanceof Error ? failure.message : "Falha ao enviar solicitação.");
    } finally {
      setBusy(false);
    }
  }

  async function loadAssignedEpics() {
    const payload = {
      type: "komatsu_factory_wizard_submission",
      action: "list_assigned_epics",
      readOnly: true,
      instruction: "Consulte somente os épicos Jira atribuídos ao usuário autenticado (use currentUser() ou equivalente, sem buscar pelo nome). Retorne todas as correspondências como workflow.jiraEpics, incluindo issueType retornado pela API. Itens sem tipo confirmado podem ser retornados para exibir validação, mas nunca devem ser tratados como épicos. Não crie, edite, atribua, comente ou altere issues. Reabra open_factory_wizard mantendo o estado atual do wizard."
    };
    await sendAgentMessage(`Lista de épicos solicitada pelo Factory Wizard:\n\n${JSON.stringify(payload, null, 2)}`, "documents");
  }

  async function lookupEpic() {
    const query = epicQuery.trim();
    if (!query) {
      setFieldErrors({ ...fieldErrors, epicQuery: "Informe uma chave ou link de épico." });
      return;
    }
    const payload = {
      type: "komatsu_factory_wizard_submission",
      action: "lookup_jira_epic",
      gapId: selectedGap?.gapId ?? null,
      epicQuery: query,
      readOnly: true,
      instruction: "Faça uma consulta Jira somente de leitura por chave ou URL. Confirme pelo tipo retornado pela API se o item é Epic/Épico; nunca infira o tipo pelo título. Retorne a chave, resumo, tipo, URL e uma mensagem de validação se não for épico. Não crie nem altere issues. Reabra open_factory_wizard com workflow.jiraLookup."
    };
    await sendAgentMessage(`Consulta Jira solicitada pelo Factory Wizard:\n\n${JSON.stringify(payload, null, 2)}`, "documents");
  }

  function addDroppedFiles(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    if (!files.length) return;
    if (!primaryFile) setPrimaryFile(files[0]);
    else setSupportingFiles((current) => [...current, files[0]]);
    if (files.length > 1) setSupportingFiles((current) => [...current, ...files.slice(1)]);
  }

  async function stageFiles(intent: "intake" | "replacement"): Promise<StagedFile[]> {
    if (!app) throw new Error("O servidor do wizard ainda não está conectado.");
    const filesToStage: Array<{
      file: File;
      primary: boolean;
      role: "functional_spec" | "technical_spec" | "supporting";
    }> = [
      ...(primaryFile ? [{ file: primaryFile, primary: true, role: "functional_spec" as const }] : []),
      ...(technicalFile ? [{ file: technicalFile, primary: false, role: "technical_spec" as const }] : []),
      ...supportingFiles.map((file) => ({ file, primary: false, role: "supporting" as const }))
    ];
    if (intent === "intake" && !primaryFile) throw new Error("Selecione a especificação funcional para iniciar um GAP novo.");
    if (!filesToStage.length) throw new Error("Selecione ao menos um documento para substituir.");

    const files = await Promise.all(filesToStage.map(async ({ file, primary, role }) => {
      const extension = file.name.split(".").pop()?.toLowerCase();
      if (role !== "supporting" && extension !== "pdf" && extension !== "docx") {
        throw new Error(`${file.name}: a especificação funcional ou técnica deve ser PDF ou DOCX.`);
      }
      return {
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        base64: await fileToBase64(file),
        primary,
        role
      };
    }));

    const result = await app.callServerTool({
      name: "stage_factory_documents",
      arguments: { intent, files }
    });
    if (result.isError) {
      const errorText = result.content.find((item) => item.type === "text");
      throw new Error(errorText?.type === "text" ? errorText.text : "O servidor não conseguiu receber os documentos.");
    }
    const receipt = result.structuredContent as { files?: StagedFile[] } | undefined;
    if (!receipt?.files?.length) throw new Error("O servidor não retornou os caminhos dos documentos.");
    return receipt.files;
  }

  function validateDocumentStep(): boolean {
    const errors: Record<string, string> = {};
    if (workMode === "new" && !primaryFile) {
      errors.functionalSpec = "A especificação funcional é obrigatória para iniciar o GAP.";
    }
    if (workMode === "continue" && replaceDocuments && !primaryFile && !technicalFile && !supportingFiles.length) {
      errors.replacement = "Selecione os arquivos que deseja substituir ou desmarque a opção de troca.";
    }
    if (workMode === "continue" && replaceEpic && !selectedEpicKey && !epicQuery.trim()) {
      errors.epicQuery = "Selecione um épico validado ou desmarque a troca do vínculo.";
    }
    if ((workMode === "new" || replaceEpic) && (selectedEpicKey || epicQuery.trim())) {
      const selected = jiraEpics.find((epic) => epic.key === selectedEpicKey) ??
        (lookup?.key === selectedEpicKey ? lookup : null);
      if (selected && !isEpic(selected.issueType)) errors.epicQuery = "O item selecionado não é um épico. Escolha um épico confirmado pelo Jira.";
      else if (epicQuery.trim() && (!lookup || !isEpic(lookup.issueType))) errors.epicQuery = epicValidation ?? "Valide a chave ou o link com o Jira e selecione um épico.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function continueFromDocuments() {
    if (!validateDocumentStep()) return;
    setErrorMessage(null);
    if (workMode === "continue" && !replaceDocuments && !replaceEpic) {
      setScreen(nextLocalScreen());
      return;
    }

    setBusy(true);
    try {
      const staged = workMode === "new" || replaceDocuments
        ? await stageFiles(workMode === "new" ? "intake" : "replacement")
        : [];
      const chosenEpic = jiraEpics.find((epic) => epic.key === selectedEpicKey) ??
        (lookup?.key === selectedEpicKey ? lookup : null);
      if (workMode === "continue" && replaceEpic && chosenEpic) {
        const referenceResult = await app?.callServerTool({
          name: "save_factory_jira_reference",
          arguments: {
            gapId: selectedGap!.gapId,
            epicKey: chosenEpic.key,
            epicId: chosenEpic.id,
            summary: chosenEpic.summary,
            url: chosenEpic.url,
            issueType: chosenEpic.issueType ?? ""
          }
        });
        if (referenceResult?.isError) {
          const detail = referenceResult.content.find((item) => item.type === "text");
          throw new Error(detail?.type === "text" ? detail.text : "Não foi possível salvar a referência local do épico.");
        }
      }
      const payload = {
        type: workMode === "new" ? "komatsu_factory_wizard_intake" : "komatsu_factory_wizard_submission",
        mode: workMode,
        gapId: selectedGap?.gapId ?? null,
        primarySpecPath: staged.find((file) => file.role === "functional_spec")?.relativePath ?? selectedGap?.specPath ?? null,
        technicalSpecPath: staged.find((file) => file.role === "technical_spec")?.relativePath ?? null,
        supportingDocumentPaths: staged.filter((file) => file.role === "supporting").map((file) => file.relativePath),
        selectedEpicKey: selectedEpicKey || (replaceEpic ? null : selectedGap?.jiraEpic?.key ?? null),
        selectedEpic: chosenEpic ? {
          key: chosenEpic.key,
          id: chosenEpic.id ?? null,
          summary: chosenEpic.summary,
          issueType: chosenEpic.issueType ?? null,
          url: chosenEpic.url ?? null
        } : null,
        epicQuery: epicQuery.trim() || null,
        replaceDocuments,
        replaceEpic,
        action: workMode === "new" ? "start_intake" : "update_gap_context",
        instruction: "Siga AGENTS.md e as skills existentes. Não presuma tipo Jira: confirme issueType retornado pelo Jira antes de aceitar Epic. Apresente problemas como validationMessages no workflow e não avance enquanto houver bloqueadores. Na análise, reporte somente definições rastreáveis à especificação; transforme lacunas e ambiguidades em perguntas sem inferir valores. O envio não aprova o plano nem autoriza gravação no Jira. Para GAP novo, depois que o kickoff criar a pasta e o gapId estiver confirmado, grave a referência local do épico escolhido usando save_factory_jira_reference (isso só altera jira-reference.json, não o Jira). Ao terminar, reabra open_factory_wizard com a fase e as perguntas/plano atuais."
      };
      const result = await app?.sendMessage({
        role: "user",
        content: [{ type: "text", text: `Dados enviados pelo Factory Wizard:\n\n${JSON.stringify(payload, null, 2)}` }]
      });
      if (result?.isError) throw new Error("O Cursor não aceitou o envio do wizard.");
      pendingDestination.current = workMode === "new" ? "new-flow" : "auto";
      setWaitingForAgent(true);
    } catch (failure) {
      setErrorMessage(failure instanceof Error ? failure.message : "Falha ao enviar os dados.");
    } finally {
      setBusy(false);
    }
  }

  function nextLocalScreen(): Screen {
    const workflow = state?.workflow;
    if (workflow?.phase) return phaseToScreen(workflow.phase);
    if (workflow?.questions.length) return "analysis";
    if ((selectedGap?.currentStage ?? 0) > 1) return "execution";
    if (workflow?.planMarkdown || selectedGap?.planMarkdown) return "plan_review";
    if (Object.keys(workflow?.answers ?? {}).length || Object.keys(selectedGap?.specAnswers ?? {}).length) return "analysis";
    return "analysis";
  }

  async function submitAnswers() {
    if (!state || !selectedGap) return;
    if (!answersDirty) return;
    const errors: Record<string, string> = {};
    for (const question of state.workflow.questions) {
      if (question.required && !(answers[question.id] ?? "").trim()) {
        errors[question.id] = "Esta resposta é obrigatória para continuar.";
      }
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    const changedAnswers = Object.fromEntries(
      Object.keys({ ...savedAnswers, ...answers })
        .filter((key) => (answers[key] ?? "") !== (savedAnswers[key] ?? ""))
        .map((key) => [key, answers[key] ?? ""])
    );
    const payload = {
      type: "komatsu_factory_wizard_submission",
      gapId: selectedGap.gapId,
      action: "submit_analysis_answers",
      answers: changedAnswers,
      changedAnswerIds: Object.keys(changedAnswers),
      instruction: "Atualize somente as respostas listadas em answers nos artefatos do GAP pelo fluxo existente, preservando as demais respostas já registradas. Uma resposta vazia representa remoção explícita daquele valor. Continue a análise/plano sem complementar respostas por inferência. Quando o plano estiver pronto, reabra open_factory_wizard com phase=plan_review e planMarkdown."
    };
    await sendAgentMessage(`Respostas da análise enviadas pelo Factory Wizard:\n\n${JSON.stringify(payload, null, 2)}`, "answers-saved");
  }

  async function approvePlan() {
    if (!state || !selectedGap) return;
    if (serverBlockingMessages.length) {
      setErrorMessage("Resolva as pendências bloqueadoras antes de aprovar o plano.");
      return;
    }
    if (!approvalConfirmed) {
      setFieldErrors({ approval: "Confirme explicitamente a aprovação do plano para continuar." });
      return;
    }
    const payload = {
      type: "komatsu_factory_wizard_submission",
      gapId: selectedGap.gapId,
      action: "approve_development_plan",
      explicitApproval: true,
      planPath: state.workflow.planPath ?? "01_analise/DEVELOPMENT_PLAN.md",
      instruction: "O usuário aprovou explicitamente este plano pelo botão do wizard. Siga AGENTS.md: execute jira-story-sync antes da implementação e limite a sincronização ao escopo aprovado. Não altere status/responsáveis sem autorização."
    };
    await sendAgentMessage(`Aprovação explícita do plano registrada no Factory Wizard:\n\n${JSON.stringify(payload, null, 2)}`);
  }

  async function requestPlanChanges() {
    const request = planChangeRequest.trim();
    if (!request) {
      setFieldErrors({ planChangeRequest: "Descreva o ajuste solicitado ao plano." });
      return;
    }
    const payload = {
      type: "komatsu_factory_wizard_submission",
      gapId: selectedGap?.gapId ?? null,
      action: "request_plan_changes",
      requestedChanges: request,
      instruction: "Ajuste o DEVELOPMENT_PLAN.md somente conforme o pedido informado. Não trate esse pedido como aprovação. Reabra open_factory_wizard com phase=plan_review e o conteúdo atualizado do plano."
    };
    await sendAgentMessage(`Ajustes solicitados pelo usuário no plano:\n\n${JSON.stringify(payload, null, 2)}`);
  }

  function goBackToPreviousStep() {
    if (screen === "execution") {
      setScreen(state?.workflow.planMarkdown || selectedGap?.planMarkdown ? "plan_review" : "analysis");
      return;
    }
    setScreen("analysis");
  }

  async function submitAction(action: Action) {
    if (!selectedGap) return;
    if (action.requiresConfirmation && !confirmations[action.id]) {
      setFieldErrors({ [action.id]: `Confirme a ação “${action.label}” para continuar.` });
      return;
    }
    await sendAgentMessage(`Ação solicitada pelo Factory Wizard:\n\n${JSON.stringify({
      type: "komatsu_factory_wizard_submission",
      gapId: selectedGap.gapId,
      action: action.id,
      actionLabel: action.label,
      answers,
      instruction: "Processe conforme AGENTS.md, estado atual do GAP e skills existentes. Não assuma dados ausentes."
    }, null, 2)}`);
  }

  if (error) {
    return <main style={{ ...styles.page, background: colors.background, color: colors.text }}>Erro ao conectar ao wizard: {error.message}</main>;
  }
  if (!app || !state) {
    return <main style={{ ...styles.page, background: colors.background, color: colors.text }}>Conectando ao Factory Wizard…</main>;
  }

  const selectedEpics = jiraEpics.filter((epic) => isEpic(epic.issueType));
  const gapDocuments = selectedGap?.documents.filter((file) => file.includes("00_spec/")) ?? [];
  const currentEpicKey = selectedGap?.jiraEpic?.key ?? "";

  return (
    <main style={{ ...styles.page, background: colors.background, color: colors.text }}>
      <header style={styles.header}>
        <p style={{ ...styles.eyebrow, color: colors.accent }}>KOMATSU · FACTORY ORCHESTRATOR</p>
        <h1 style={styles.title}>Assistente de desenvolvimento</h1>
        <p style={{ ...styles.subtitle, color: colors.muted }}>Retome um GAP ou inicie um desenvolvimento novo.</p>
      </header>

      {screen !== "start" && <Progress
        active={screen}
        colors={colors}
        canViewPlan={Boolean(state.workflow.planMarkdown || selectedGap?.planMarkdown)}
        canViewExecution={Boolean(selectedGap?.stages.length)}
        onNavigate={setScreen}
      />}
      {errorMessage && <Notice message={errorMessage} kind="error" colors={colors} />}
      {waitingForAgent && <Notice message="Solicitação enviada. Aguardando o agente atualizar esta etapa…" kind="info" colors={colors} />}
      <ValidationNotices messages={state.workflow.validationMessages} colors={colors} />

      {screen === "start" && (
        <>
          <section style={{ ...styles.card, background: colors.surface, borderColor: colors.border }}>
            <h2 style={styles.heading}>Como deseja começar?</h2>
            <div style={styles.choiceGrid}>
              <button type="button" onClick={startNewGap} style={{ ...styles.choice, background: workMode === "new" ? colors.surfaceRaised : colors.surface, borderColor: workMode === "new" ? colors.accent : colors.border, color: colors.text }}>
                <strong>Novo GAP</strong><span style={{ color: colors.muted }}>Enviar especificações e iniciar a análise</span>
              </button>
              <button type="button" onClick={() => setWorkMode("continue")} style={{ ...styles.choice, background: workMode === "continue" ? colors.surfaceRaised : colors.surface, borderColor: workMode === "continue" ? colors.accent : colors.border, color: colors.text }}>
                <strong>Continuar GAP</strong><span style={{ color: colors.muted }}>Retomar a etapa e as pendências existentes</span>
              </button>
            </div>
            {workMode === "continue" && (
              <>
                {state.gaps.length ? (
                  <label style={styles.label}>
                    GAP existente
                    <select value={selectedGapId} onChange={(event) => setSelectedGapId(event.target.value)} style={{ ...styles.input, background: colors.surfaceRaised, color: colors.text, borderColor: colors.border }}>
                      <option value="">Selecione um GAP</option>
                      {state.gaps.map((gap) => <option key={gap.gapId} value={gap.gapId}>{gap.gapId} · {gap.slug}</option>)}
                    </select>
                  </label>
                ) : <Notice message="Nenhum GAP com gap.json válido foi encontrado no workspace." kind="warning" colors={colors} />}
                <button type="button" disabled={!selectedGap} onClick={enterSelectedGap} style={{ ...styles.primaryButton, background: selectedGap ? colors.accent : colors.border, color: colors.accentText }}>Abrir GAP</button>
              </>
            )}
          </section>
        </>
      )}

      {screen === "documents" && (
        <>
          {selectedGap && <section style={{ ...styles.card, background: colors.surface, borderColor: colors.border }}>
            <div style={styles.titleRow}><div><h2 style={styles.heading}>{selectedGap.gapId} · {selectedGap.slug}</h2><p style={{ ...styles.help, color: colors.muted }}>Etapa atual: {capitalizeInitial(state.workflow.currentStage ?? selectedGap.status ?? "não informada")}</p></div><span style={{ ...styles.badge, background: colors.surfaceRaised, color: colors.text }}>{capitalizeInitial(selectedGap.status ?? "status não informado")}</span></div>
          </section>}

          <section style={{ ...styles.card, background: colors.surface, borderColor: colors.border }}>
            <h2 style={styles.heading}>{workMode === "new" ? "Documentação do novo GAP" : "Documentação atual"}</h2>
            {workMode === "continue" && <>
              <p style={{ ...styles.help, color: colors.muted }}>Quer substituir algum documento antes de continuar?</p>
              <label style={styles.checkboxRow}><input type="checkbox" checked={replaceDocuments} onChange={(event) => setReplaceDocuments(event.target.checked)} /> Trocar documentação existente</label>
              <ul style={styles.fileList}>{(gapDocuments.length ? gapDocuments : selectedGap?.specPath ? [selectedGap.specPath] : []).map((file) => <li key={file} style={styles.filePath}><code>{file}</code></li>)}</ul>
              {!replaceDocuments && <p style={{ ...styles.help, color: colors.muted }}>Os documentos atuais serão mantidos.</p>}
            </>}

            {(workMode === "new" || replaceDocuments) && <>
              <div onDragOver={(event) => event.preventDefault()} onDrop={addDroppedFiles} style={{ ...styles.dropzone, background: colors.surfaceRaised, borderColor: colors.border }}>
                <p style={styles.dropTitle}>{workMode === "new" ? "Especificação funcional" : "Nova especificação funcional (opcional)"}</p>
                <p style={{ ...styles.help, color: colors.muted }}>PDF ou DOCX. O conteúdo será analisado; a extensão sozinha não valida a especificação.</p>
                <label style={{ ...styles.buttonSecondary, borderColor: colors.border, color: colors.text }}>Selecionar EF<input type="file" accept=".pdf,.docx" onChange={(event) => setPrimaryFile(event.target.files?.[0] ?? null)} style={styles.hiddenInput} /></label>
                {primaryFile && <p style={styles.filePill}>{primaryFile.name}</p>}
              </div>
              <div style={styles.fileControls}>
                <label style={{ ...styles.buttonSecondary, borderColor: colors.border, color: colors.text }}>Selecionar ET<input type="file" accept=".pdf,.docx" onChange={(event) => setTechnicalFile(event.target.files?.[0] ?? null)} style={styles.hiddenInput} /></label>
                <label style={{ ...styles.buttonSecondary, borderColor: colors.border, color: colors.text }}>Adicionar apoio<input type="file" multiple accept=".pdf,.docx,.xlsx,.csv,.tsv,.md,.txt,.png,.jpg,.jpeg" onChange={(event) => { setSupportingFiles((files) => [...files, ...Array.from(event.target.files ?? [])]); event.currentTarget.value = ""; }} style={styles.hiddenInput} /></label>
              </div>
              {technicalFile && <p style={styles.filePill}>ET: {technicalFile.name}</p>}
              {supportingFiles.map((file, index) => <p key={`${file.name}-${index}`} style={styles.filePill}>Apoio: {file.name}</p>)}
              {fieldErrors.functionalSpec && <FieldError message={fieldErrors.functionalSpec} colors={colors} />}
              {fieldErrors.replacement && <FieldError message={fieldErrors.replacement} colors={colors} />}
            </>}
          </section>

          <section style={{ ...styles.card, background: colors.surface, borderColor: colors.border }}>
            <h2 style={styles.heading}>Épico Jira <span style={{ ...styles.optional, color: colors.muted }}>{workMode === "new" ? "Opcional" : "Referência atual"}</span></h2>
            {workMode === "continue" && <>
              <label style={styles.checkboxRow}><input type="checkbox" checked={replaceEpic} onChange={(event) => {
                const shouldReplaceEpic = event.target.checked;
                setReplaceEpic(shouldReplaceEpic);
                if (shouldReplaceEpic) void loadAssignedEpics();
              }} /> Trocar épico relacionado</label>
              {!replaceEpic && <p style={{ ...styles.help, color: colors.muted }}>{currentEpicKey ? `Épico atual: ${currentEpicKey}` : "Nenhum épico registrado em jira-reference.json."}</p>}
            </>}
            {(workMode === "new" || replaceEpic) && <>
              {selectedEpics.length > 0 ? <label style={styles.label}>Épicos atribuídos a você
                <select value={selectedEpicKey} onChange={(event) => setSelectedEpicKey(event.target.value)} style={{ ...styles.input, background: colors.surfaceRaised, color: colors.text, borderColor: colors.border }}>
                  <option value="">Não vincular agora</option>
                  {selectedEpics.map((epic) => <option key={epic.key} value={epic.key}>{epic.key} · {epic.summary}</option>)}
                </select>
              </label> : <><p style={{ ...styles.help, color: colors.muted }}>Nenhum épico foi fornecido pelo Jira. Você pode carregar sua lista ou buscar por chave/link.</p><button type="button" onClick={loadAssignedEpics} disabled={busy || waitingForAgent} style={{ ...styles.buttonSecondary, borderColor: colors.border, color: colors.text }}>Carregar meus épicos</button></>}
              <label style={styles.label}>Buscar fora da lista (somente consulta)
                <div style={styles.inlineField}><input value={epicQuery} onChange={(event) => setEpicQuery(event.target.value)} placeholder="Ex.: KS-123 ou URL do Jira" style={{ ...styles.input, background: colors.surfaceRaised, color: colors.text, borderColor: colors.border }} /><button type="button" onClick={lookupEpic} disabled={busy || !epicQuery.trim()} style={{ ...styles.buttonSecondary, borderColor: colors.border, color: colors.text }}>Buscar épico</button></div>
              </label>
              {lookup && <p style={{ ...styles.help, color: epicValidation ? colors.danger : colors.success }}>{epicValidation ?? `${lookup.key} · ${lookup.summary} · ${lookup.issueType}`}</p>}
              {lookup?.key && lookup.summary && isEpic(lookup.issueType) && <button type="button" onClick={() => setSelectedEpicKey(lookup.key!)} style={{ ...styles.buttonSecondary, borderColor: colors.accent, color: colors.text }}>Usar este épico</button>}
              {fieldErrors.epicQuery && <FieldError message={fieldErrors.epicQuery} colors={colors} />}
              {state.workflow.validationMessages.filter((message) => message.field === "epic").map((message, index) => <FieldError key={index} message={message.message} colors={colors} />)}
            </>}
            <p style={{ ...styles.help, color: colors.muted }}>A consulta é somente leitura. Não cria nem altera cards do Jira.</p>
          </section>

          <button type="button" disabled={busy || waitingForAgent} onClick={continueFromDocuments} style={{ ...styles.primaryButton, background: colors.accent, color: colors.accentText }}>{busy ? "Enviando…" : workMode === "new" ? "Analisar especificação" : replaceDocuments || replaceEpic ? "Validar alterações e continuar" : "Continuar para análise"}</button>
          {workMode === "new" && <button type="button" onClick={() => setScreen("start")} style={{ ...styles.buttonSecondary, borderColor: colors.border, color: colors.text }}>Voltar</button>}
        </>
      )}

      {screen === "analysis" && (
        <>
          {selectedGap && <ContextHeader gap={selectedGap} stage={state.workflow.currentStage} colors={colors} />}
          <button type="button" onClick={() => setScreen("documents")} style={{ ...styles.buttonSecondary, borderColor: colors.border, color: colors.text, marginBottom: 12 }}>Voltar para etapa anterior</button>
          {state.workflow.summary && <section style={{ ...styles.card, background: colors.surface, borderColor: colors.border }}><h2 style={styles.heading}>Resumo da análise</h2><p>{capitalizeInitial(state.workflow.summary)}</p></section>}
          {state.workflow.findings.length > 0 && <section style={{ ...styles.card, background: colors.surface, borderColor: colors.border }}>
            <h2 style={styles.heading}>Definições identificadas</h2>
            <p style={{ ...styles.help, color: colors.muted }}>Somente informações encontradas na documentação são apresentadas como confirmadas.</p>
            <ul style={styles.findingList}>{state.workflow.findings.map((finding, index) => <li key={`${finding.label}-${index}`}><strong>{capitalizeInitial(finding.label)}:</strong> {finding.status === "confirmed" ? capitalizeInitial(finding.value ?? "") : finding.status === "uncertain" ? `Precisa de confirmação${finding.value ? ` — ${capitalizeInitial(finding.value)}` : ""}` : "Não identificado na documentação"}{finding.source && <small style={{ display: "block", color: colors.muted }}>Fonte: {finding.source}</small>}</li>)}</ul>
          </section>}
          {state.workflow.questions.length || Object.keys(answers).length ? <>
            <section style={{ ...styles.card, background: colors.surface, borderColor: colors.border }}><h2 style={styles.heading}>Perguntas e respostas da análise <span style={{ ...styles.optional, color: colors.muted }}>{state.workflow.questions.length || Object.keys(answers).length} item(ns)</span></h2><p style={{ ...styles.help, color: colors.muted }}>As respostas existentes foram carregadas para revisão. Edite o que precisar e salve para atualizar o arquivo de respostas.</p>
                {state.workflow.questions.map((question, index) => <div key={question.id} style={styles.questionBlock}>
                <label style={styles.label} htmlFor={`answer-${question.id}`}>{index + 1}. {capitalizeInitial(question.label)}{question.required && <span style={{ color: colors.danger }}> *</span>}</label>
                {question.details && <p style={{ ...styles.help, color: colors.muted, whiteSpace: "pre-wrap" }}>{capitalizeInitial(question.details)}</p>}
                {question.kind === "select" ? <select id={`answer-${question.id}`} value={answers[question.id] ?? ""} onChange={(event) => { setAnswers({ ...answers, [question.id]: event.target.value }); setFieldErrors({ ...fieldErrors, [question.id]: "" }); }} style={{ ...styles.input, background: colors.surfaceRaised, color: colors.text, borderColor: colors.border }}><option value="">Selecione uma resposta</option>{question.options?.map((option) => <option key={option} value={option}>{option}</option>)}</select>
                  : question.kind === "boolean" ? <select id={`answer-${question.id}`} value={answers[question.id] ?? ""} onChange={(event) => { setAnswers({ ...answers, [question.id]: event.target.value }); setFieldErrors({ ...fieldErrors, [question.id]: "" }); }} style={{ ...styles.input, background: colors.surfaceRaised, color: colors.text, borderColor: colors.border }}><option value="">Selecione</option><option value="sim">Sim</option><option value="não">Não</option></select>
                    : question.kind === "text" ? <input id={`answer-${question.id}`} value={answers[question.id] ?? ""} onChange={(event) => { setAnswers({ ...answers, [question.id]: event.target.value }); setFieldErrors({ ...fieldErrors, [question.id]: "" }); }} style={{ ...styles.input, background: colors.surfaceRaised, color: colors.text, borderColor: colors.border }} />
                      : <textarea id={`answer-${question.id}`} value={answers[question.id] ?? ""} onChange={(event) => { setAnswers({ ...answers, [question.id]: event.target.value }); setFieldErrors({ ...fieldErrors, [question.id]: "" }); }} placeholder="Responda com a informação confirmada. Se ainda não foi definida, informe isso." style={{ ...styles.textarea, background: colors.surfaceRaised, color: colors.text, borderColor: colors.border }} />}
                {fieldErrors[question.id] && <FieldError message={fieldErrors[question.id]} colors={colors} />}
              </div>)}
              {Object.entries(answers).filter(([id]) => !state.workflow.questions.some((question) => question.id === id)).map(([id, answer], index) => <div key={id} style={styles.questionBlock}>
                <label style={styles.label} htmlFor={`answer-${id}`}>{state.workflow.questions.length + index + 1}. {id.replaceAll("_", " ")}</label>
                <textarea id={`answer-${id}`} value={answer} onChange={(event) => setAnswers({ ...answers, [id]: event.target.value })} style={{ ...styles.textarea, background: colors.surfaceRaised, color: colors.text, borderColor: colors.border }} />
              </div>)}
            </section>
            {answersDirty ? <button type="button" disabled={busy || waitingForAgent} onClick={submitAnswers} style={{ ...styles.primaryButton, background: colors.accent, color: colors.accentText }}>{busy ? "Salvando respostas…" : "Salvar alterações e continuar"}</button> : <>
              <p style={{ ...styles.help, color: colors.muted }}>Nenhuma alteração nas respostas. Você ainda pode consultar o plano e as etapas deste GAP.</p>
              <div style={styles.fileControls}>
                {(state.workflow.planMarkdown || selectedGap?.planMarkdown) && <button type="button" onClick={() => setScreen("plan_review")} style={{ ...styles.buttonSecondary, borderColor: colors.border, color: colors.text }}>Visualizar plano</button>}
                {selectedGap?.stages.length ? <button type="button" onClick={() => setScreen("execution")} style={{ ...styles.buttonSecondary, borderColor: colors.border, color: colors.text }}>Ver etapas do GAP</button> : null}
              </div>
            </>}
          </> : <Notice message="Nenhuma pergunta pendente foi informada pelo agente. O wizard não vai inventar perguntas ou respostas." kind="info" colors={colors} />}
          {state.workflow.availableActions.map((action) => <section key={action.id} style={{ ...styles.card, background: colors.surface, borderColor: colors.border }}>{action.description && <p>{capitalizeInitial(action.description)}</p>}{action.requiresConfirmation && <label style={styles.checkboxRow}><input type="checkbox" checked={confirmations[action.id] ?? false} onChange={(event) => setConfirmations({ ...confirmations, [action.id]: event.target.checked })} /> Confirmo: {capitalizeInitial(action.label)}</label>}<button type="button" onClick={() => submitAction(action)} disabled={busy || waitingForAgent} style={{ ...styles.button, background: colors.accent, color: colors.accentText }}>{capitalizeInitial(action.label)}</button>{fieldErrors[action.id] && <FieldError message={fieldErrors[action.id]} colors={colors} />}</section>)}
        </>
      )}

      {screen === "plan_review" && (
        <>
          {selectedGap && <ContextHeader gap={selectedGap} stage={state.workflow.currentStage} colors={colors} />}
          <button type="button" onClick={goBackToPreviousStep} style={{ ...styles.buttonSecondary, borderColor: colors.border, color: colors.text, marginBottom: 12 }}>Voltar para etapa anterior</button>
          <section style={{ ...styles.card, background: colors.surface, borderColor: colors.border }}>
            <div style={styles.titleRow}><div><h2 style={styles.heading}>Plano de desenvolvimento</h2><p style={{ ...styles.help, color: colors.muted }}>Gerado pela skill existente a partir da análise e das respostas.</p></div><span style={{ ...styles.badge, background: planApproved ? colors.success : colors.warning, color: colors.background }}>{planApproved ? "Aprovado" : "Aguardando aprovação"}</span></div>
            <p style={{ ...styles.help, color: colors.muted }}><code>{state.workflow.planPath ?? "01_analise/DEVELOPMENT_PLAN.md"}</code></p>
            <MarkdownPreview markdown={state.workflow.planMarkdown ?? selectedGap?.planMarkdown ?? ""} colors={colors} />
            {!state.workflow.planMarkdown && !selectedGap?.planMarkdown && <Notice message="O agente ainda não forneceu o conteúdo do plano. Nenhum plano será inventado pelo wizard." kind="warning" colors={colors} />}
          </section>
          {!planApproved && <>
            <label style={styles.label} htmlFor="plan-change-request">Observações ou ajustes solicitados</label>
            <textarea id="plan-change-request" value={planChangeRequest} onChange={(event) => setPlanChangeRequest(event.target.value)} placeholder="Descreva o que precisa ser corrigido no plano." style={{ ...styles.textarea, background: colors.surfaceRaised, color: colors.text, borderColor: colors.border }} />
            {fieldErrors.planChangeRequest && <FieldError message={fieldErrors.planChangeRequest} colors={colors} />}
            <label style={styles.checkboxRow}><input type="checkbox" checked={approvalConfirmed} onChange={(event) => setApprovalConfirmed(event.target.checked)} /> Aprovo explicitamente este plano de desenvolvimento.</label>
            {fieldErrors.approval && <FieldError message={fieldErrors.approval} colors={colors} />}
            <div style={styles.fileControls}>
              <button type="button" onClick={requestPlanChanges} disabled={busy || waitingForAgent} style={{ ...styles.buttonSecondary, borderColor: colors.border, color: colors.text }}>Solicitar ajuste</button>
              <button type="button" onClick={approvePlan} disabled={busy || waitingForAgent || !approvalConfirmed || serverBlockingMessages.length > 0} style={{ ...styles.primaryButton, background: colors.accent, color: colors.accentText }}>Aprovar plano</button>
            </div>
            <p style={{ ...styles.help, color: colors.muted }}>A sincronização com Jira só pode ocorrer depois desta aprovação explícita.</p>
          </>}
          {planApproved && <Notice message="Plano aprovado. O próximo passo será tratado pelo fluxo existente." kind="success" colors={colors} />}
        </>
      )}

      {screen === "execution" && (
        <>
          {selectedGap && <ContextHeader gap={selectedGap} stage={state.workflow.currentStage} colors={colors} />}
          <button type="button" onClick={goBackToPreviousStep} style={{ ...styles.buttonSecondary, borderColor: colors.border, color: colors.text, marginBottom: 12 }}>Voltar para etapa anterior</button>
          {selectedGap?.stages.length ? <section style={{ ...styles.card, background: colors.surface, borderColor: colors.border }}><h2 style={styles.heading}>Etapas do GAP</h2><ol style={styles.stageList}>{selectedGap.stages.map((stage) => {
            const progress = stageProgress(stage.status);
            const progressColor = progress === "completed" ? colors.success : progress === "inProgress" ? colors.accent : colors.muted;
            return <li key={stage.number} style={{ ...styles.stageRow, ...(progress === "inProgress" ? { background: colors.surfaceRaised, borderLeft: `3px solid ${colors.accent}` } : {}) }}>
              <span style={styles.stageDetails}>
                <input type="checkbox" checked={progress === "completed"} readOnly aria-label={`${capitalizeInitial(stage.name)}: ${stageProgressLabel(progress)}`} style={{ width: 18, height: 18, margin: 0, flex: "0 0 auto", accentColor: progressColor }} />
                <strong style={{ color: progress === "inProgress" ? colors.accent : progress === "completed" ? colors.success : colors.text }}>{capitalizeInitial(stage.name)}</strong>
              </span>
              <span style={{ ...styles.stageStatus, color: progressColor }}>{progress === "inProgress" && <span aria-hidden="true">⟳ </span>}{stageProgressLabel(progress)}</span>
            </li>;
          })}</ol></section> : null}
          <section style={{ ...styles.card, background: colors.surface, borderColor: colors.border }}><h2 style={styles.heading}>{state.workflow.currentStage ?? "Etapa atual do GAP"}</h2>{state.workflow.summary && <p>{state.workflow.summary}</p>}{state.workflow.dependencies.map((dependency, index) => <p key={`${dependency}-${index}`}>• {dependency}</p>)}</section>
          {state.workflow.availableActions.map((action) => <section key={action.id} style={{ ...styles.card, background: colors.surface, borderColor: colors.border }}>{action.description && <p>{capitalizeInitial(action.description)}</p>}{action.requiresConfirmation && <label style={styles.checkboxRow}><input type="checkbox" checked={confirmations[action.id] ?? false} onChange={(event) => setConfirmations({ ...confirmations, [action.id]: event.target.checked })} /> Confirmo: {capitalizeInitial(action.label)}</label>}<button type="button" onClick={() => submitAction(action)} disabled={busy || waitingForAgent} style={{ ...styles.button, background: colors.accent, color: colors.accentText }}>{capitalizeInitial(action.label)}</button>{fieldErrors[action.id] && <FieldError message={fieldErrors[action.id]} colors={colors} />}</section>)}
          {!state.workflow.availableActions.length && <Notice message="O agente não informou ações disponíveis para esta etapa. O wizard não vai inventar controles." kind="info" colors={colors} />}
        </>
      )}
    </main>
  );
}

function Progress({ active, colors, canViewPlan, canViewExecution, onNavigate }: {
  active: Screen;
  colors: ThemeColors;
  canViewPlan: boolean;
  canViewExecution: boolean;
  onNavigate: (screen: Screen) => void;
}) {
  const labels: Array<{ screen: Screen; label: string; available: boolean }> = [
    { screen: "documents", label: "Documentação e Jira", available: true },
    { screen: "analysis", label: "Análise", available: true },
    { screen: "plan_review", label: "Plano", available: canViewPlan },
    { screen: "execution", label: "Etapas GAP", available: canViewExecution }
  ];
  const activeIndex = labels.findIndex((item) => item.screen === active);
  return <nav aria-label="Etapas do wizard" style={styles.progress}>
    {labels.map((item, index) => <button
      key={item.screen}
      type="button"
      disabled={!item.available}
      aria-current={item.screen === active ? "step" : undefined}
      onClick={() => onNavigate(item.screen)}
      style={{ ...styles.progressItem, border: 0, padding: 0, background: "transparent", font: "inherit", cursor: item.available ? "pointer" : "not-allowed", opacity: item.available ? 1 : 0.55, color: item.screen === active || index < activeIndex ? colors.accent : colors.muted }}
    ><span style={{ ...styles.progressDot, background: item.screen === active || index < activeIndex ? colors.accent : colors.surfaceRaised, color: item.screen === active || index < activeIndex ? colors.accentText : colors.muted }}>{index + 1}</span><span>{item.label}</span></button>)}
  </nav>;
}

function ContextHeader({ gap, stage, colors }: { gap: Gap; stage?: string; colors: ThemeColors }) {
  return <section style={{ ...styles.context, background: colors.surfaceRaised, borderColor: colors.border }}><strong>{gap.gapId} · {gap.slug}</strong><span style={{ color: colors.muted }}>{capitalizeInitial(stage ?? gap.status ?? "Etapa não informada")}</span>{gap.jiraEpic && <span style={{ color: colors.muted }}>Épico Jira: {gap.jiraEpic.key}</span>}</section>;
}

function ValidationNotices({ messages, colors }: { messages: ValidationMessage[]; colors: ThemeColors }) {
  if (!messages.length) return null;
  return <section aria-live="polite" style={styles.noticeList}>{messages.map((item, index) => <Notice key={`${item.field ?? "message"}-${index}`} message={capitalizeInitial(`${item.field ? `${item.field}: ` : ""}${item.message}${item.source ? ` · Fonte: ${item.source}` : ""}`)} kind={item.severity} colors={colors} />)}</section>;
}

function Notice({ message, kind, colors }: { message: string; kind: "error" | "warning" | "info" | "success"; colors: ThemeColors }) {
  const foreground = kind === "error" ? colors.danger : kind === "success" ? colors.success : kind === "warning" ? colors.warning : colors.muted;
  return <div role={kind === "error" ? "alert" : "status"} style={{ ...styles.notice, background: colors.surface, borderColor: foreground, color: foreground }}>{message}</div>;
}

function FieldError({ message, colors }: { message: string; colors: ThemeColors }) {
  return <p role="alert" style={{ ...styles.fieldError, color: colors.danger }}>⚠ {message}</p>;
}

function MarkdownPreview({ markdown, colors }: { markdown: string; colors: ThemeColors }) {
  if (!markdown.trim()) return null;
  const blocks: Array<{ type: "heading" | "paragraph" | "bullet"; text: string }> = [];
  for (const line of markdown.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("#")) blocks.push({ type: "heading", text: trimmed.replace(/^#+\s*/, "") });
    else if (/^[-*]\s+/.test(trimmed)) blocks.push({ type: "bullet", text: trimmed.replace(/^[-*]\s+/, "") });
    else if (!/^(Fonte:|Fonte\s*:)/i.test(trimmed)) blocks.push({ type: "paragraph", text: trimmed });
  }
  return <div style={{ ...styles.markdown, background: colors.surfaceRaised, borderColor: colors.border }}>{blocks.map((block, index) => block.type === "heading" ? <h3 key={index} style={styles.planHeading}>{block.text}</h3> : block.type === "bullet" ? <p key={index} style={styles.planBullet}>• {block.text}</p> : <p key={index} style={styles.planParagraph}>{block.text}</p>)}</div>;
}

const styles: Record<string, CSSProperties> = {
  page: { boxSizing: "border-box", minHeight: "100vh", maxWidth: 980, margin: "0 auto", padding: "26px 24px", fontFamily: "system-ui, sans-serif", fontSize: 16, lineHeight: 1.5 },
  header: { marginBottom: 22 }, eyebrow: { fontSize: 12, letterSpacing: 1.2, fontWeight: 700, margin: 0 },
  title: { fontSize: 28, lineHeight: 1.2, margin: "8px 0" }, subtitle: { fontSize: 16, margin: "8px 0 0" },
  card: { border: "1px solid", borderRadius: 14, padding: 20, marginBottom: 16 }, heading: { fontSize: 20, lineHeight: 1.3, margin: "0 0 10px" },
  help: { margin: "6px 0", fontSize: 14 }, optional: { fontSize: 14, fontWeight: 400 },
  choiceGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, margin: "18px 0" },
  choice: { display: "grid", textAlign: "left", gap: 5, border: "1px solid", borderRadius: 12, padding: 16, font: "inherit", cursor: "pointer" },
  label: { display: "block", fontWeight: 650, margin: "14px 0 8px" }, input: { boxSizing: "border-box", width: "100%", padding: 12, border: "1px solid", borderRadius: 8, fontSize: 16, marginTop: 6 },
  textarea: { boxSizing: "border-box", width: "100%", minHeight: 110, padding: 12, border: "1px solid", borderRadius: 8, font: "inherit", resize: "vertical" },
  primaryButton: { display: "block", border: 0, borderRadius: 10, padding: "13px 18px", fontSize: 16, fontWeight: 800, cursor: "pointer", width: "100%", margin: "12px 0" },
  buttonSecondary: { display: "inline-block", border: "1px solid", borderRadius: 9, padding: "10px 14px", fontWeight: 600, cursor: "pointer", background: "transparent" },
  hiddenInput: { position: "absolute", width: 1, height: 1, opacity: 0, overflow: "hidden" },
  dropzone: { border: "2px dashed", borderRadius: 12, padding: "20px 16px", textAlign: "center", marginTop: 12 }, dropTitle: { fontWeight: 700, fontSize: 17, margin: "0 0 6px" },
  filePill: { fontWeight: 600, margin: "10px 0 0" }, fileList: { boxSizing: "border-box", maxWidth: "100%", margin: "12px 0", paddingLeft: 22 },
  filePath: { minWidth: 0, maxWidth: "100%", overflowWrap: "anywhere", wordBreak: "break-word" },
  fileControls: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", margin: "12px 0" }, inlineField: { display: "flex", gap: 8, alignItems: "center" },
  checkboxRow: { display: "flex", gap: 10, alignItems: "center", margin: "12px 0", minHeight: 28 },
  titleRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }, badge: { padding: "4px 10px", borderRadius: 99, fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" },
  context: { display: "flex", flexWrap: "wrap", gap: "8px 18px", padding: 12, border: "1px solid", borderRadius: 10, marginBottom: 14 },
  progress: { display: "flex", flexWrap: "wrap", gap: 10, margin: "0 0 18px" }, progressItem: { display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 650 }, progressDot: { display: "inline-flex", width: 24, height: 24, alignItems: "center", justifyContent: "center", borderRadius: 99, fontWeight: 800 },
  notice: { border: "1px solid", borderRadius: 9, padding: "10px 12px", margin: "10px 0", fontSize: 14 }, noticeList: { marginBottom: 12 }, fieldError: { margin: "6px 0", fontWeight: 600, fontSize: 14 },
  questionBlock: { borderTop: "1px solid #667080", paddingTop: 14, marginTop: 14 }, findingList: { margin: "10px 0", paddingLeft: 22 }, stageList: { margin: 0, paddingLeft: 24 }, stageRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, borderBottom: "1px solid #667080", padding: "10px 8px", borderRadius: 6 }, stageDetails: { display: "flex", alignItems: "center", gap: 10, minWidth: 0 }, stageStatus: { display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap", fontWeight: 650 }, markdown: { maxHeight: 520, overflowY: "auto", border: "1px solid", borderRadius: 10, padding: 18, margin: "12px 0", whiteSpace: "normal" }, planHeading: { fontSize: 17, margin: "16px 0 6px" }, planParagraph: { margin: "6px 0" }, planBullet: { margin: "4px 0 4px 14px" }
};

createRoot(document.getElementById("root")!).render(<StrictMode><FactoryWizard /></StrictMode>);
