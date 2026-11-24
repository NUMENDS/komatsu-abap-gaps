import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { createServer } from "./server.js";
function getWorkspaceRoot() {
    const index = process.argv.indexOf("--workspace");
    const root = index >= 0 ? process.argv[index + 1] : undefined;
    if (!root) {
        throw new Error("Argumento obrigatório ausente: --workspace <caminho>");
    }
    return root;
}
async function main() {
    const server = createServer(getWorkspaceRoot());
    await server.connect(new StdioServerTransport());
}
main().catch((error) => {
    // stdout é reservado para o protocolo MCP em stdio.
    console.error("Factory Wizard MCP falhou ao iniciar:", error);
    process.exitCode = 1;
});
