// src/services/ai-agent/analyst/adapters/schema-extractor.ts
// Auto-generates a DDL-style schema string from Prisma DMMF
// for use in the SQL Generator prompt. Only includes analytics-relevant models.

import { Prisma } from "@prisma/client";

// Models relevant for analytics queries
const ANALYTICS_MODELS = new Set([
    "Region", "Province", "University",
    "Student", "StudentProfile", "StudentAcademic", "StudentAddress",
    "Faculty", "Department", "Advisor",
    "Consultant", "ConsultantProfile",
    "TimeSlot", "OnlineChannelCategory",
    "Booking", "BookingOutcome", "BookingCancellation",
    "ProblemCategory", "CancellationReason",
    "BookingAttendance", "BookingExceptionRequest",
    "StudentBehaviorStatus",
]);

// Prisma type → SQL type mapping
const TYPE_MAP: Record<string, string> = {
    Int: "INT",
    BigInt: "BIGINT",
    Float: "DOUBLE PRECISION",
    Decimal: "NUMERIC",
    String: "VARCHAR",
    Boolean: "BOOLEAN",
    DateTime: "TIMESTAMPTZ",
    Json: "JSONB",
};

function prismaTypeToSql(field: any): string {
    if (field.kind === "enum") return `VARCHAR(30) -- enum: ${field.type}`;
    const base = TYPE_MAP[field.type] || "TEXT";
    if (base === "VARCHAR" && field.nativeType?.name === "VarChar") {
        const len = field.nativeType.args?.[0] || 255;
        return `VARCHAR(${len})`;
    }
    return base;
}

let _cachedSchema: string | null = null;

/** Generate DDL from Prisma DMMF. Cached after first call. */
export function getAnalyticsSchema(): string {
    if (_cachedSchema) return _cachedSchema;

    const dmmf = Prisma.dmmf;
    const models = dmmf.datamodel.models.filter(m => ANALYTICS_MODELS.has(m.name));

    const ddlParts: string[] = [];

    for (const model of models) {
        // Get SQL table name from @@map or default
        const tableName = model.dbName || model.name.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();

        const scalarFields = model.fields.filter(
            f => f.kind === "scalar" || f.kind === "enum"
        );

        const lines: string[] = [];
        const pkFields: string[] = [];

        for (const field of scalarFields) {
            const colName = field.dbName || field.name;
            const sqlType = prismaTypeToSql(field);
            const parts = [`  ${colName} ${sqlType}`];

            if (field.isId) {
                pkFields.push(colName);
                const def = field.default;
                if (field.hasDefaultValue && typeof def === "object" && def !== null && !Array.isArray(def) && "name" in def && (def as any).name === "autoincrement") {
                    parts[0] = `  ${colName} SERIAL`;
                }
            }
            if (!field.isRequired && !field.isId) parts.push("-- nullable");

            lines.push(parts.join(" "));
        }

        // Primary key
        if (pkFields.length === 1) {
            // Inline PRIMARY KEY for single-column PK — already handled by SERIAL
            lines[0] += " PRIMARY KEY";
        } else if (pkFields.length > 1) {
            lines.push(`  PRIMARY KEY (${pkFields.join(", ")})`);
        }

        // Build FK comments from relation fields
        const relationFields = model.fields.filter(f => f.kind === "object" && f.relationFromFields?.length);
        for (const rel of relationFields) {
            const fromCol = rel.relationFromFields?.[0];
            const toModel = dmmf.datamodel.models.find(m => m.name === rel.type);
            if (fromCol && toModel) {
                const toTable = toModel.dbName || toModel.name.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
                const toCol = rel.relationToFields?.[0] || `${toTable}_id`;
                // Add as comment if the target is an analytics model
                if (ANALYTICS_MODELS.has(rel.type)) {
                    lines.push(`  -- FK: ${fromCol} → ${toTable}(${toCol})`);
                }
            }
        }

        ddlParts.push(`CREATE TABLE ${tableName} (\n${lines.join(",\n")}\n);`);
    }

    _cachedSchema = ddlParts.join("\n\n");
    return _cachedSchema;
}

/** Clear cache (useful for testing) */
export function clearSchemaCache() {
    _cachedSchema = null;
}
