import prisma from "@/lib/prisma";

export const executeSqlToolDefinition = {
    type: "function",
    function: {
        name: "executeSql",
        description: "Executes a raw PostgreSQL query. USE THIS TOOL to fetch real data when the user asks analytical questions.",
        parameters: {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description: "A valid PostgreSQL SELECT query.",
                },
            },
            required: ["query"],
        },
    },
};

export async function executeSql(query: string): Promise<string> {
    const upperQuery = query.trim().toUpperCase();

    // Basic security: only allow SELECT / WITH (CTE)
    if (!upperQuery.startsWith("SELECT") && !upperQuery.startsWith("WITH")) {
        return JSON.stringify({ error: "Only SELECT queries are allowed." });
    }

    // Block forbidden keywords
    const forbidden = ["INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "TRUNCATE", "GRANT", "REVOKE", "EXEC", "COPY", "GRANT"];
    if (forbidden.some((keyword) => upperQuery.includes(keyword))) {
        return JSON.stringify({ error: "Forbidden SQL keyword detected." });
    }

    try {
        const results = await prisma.$queryRawUnsafe(query);
        // Format BigInts properly if any
        const jsonStr = JSON.stringify(results, (key, value) =>
            typeof value === "bigint" ? value.toString() : value
        );
        return jsonStr;
    } catch (error: any) {
        console.error("[SQL_TOOL_ERROR]", error);
        return JSON.stringify({ error: error.message || "Query execution failed." });
    }
}
