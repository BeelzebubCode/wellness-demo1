// src/services/ai-agent/analyst/adapters/mongo-cache.ts
// MongoDB QUICK_LOOKUP cache for pre-computed analytics data.

export async function lookupFromCache(lookupKey: string): Promise<string | null> {
    try {
        const { getAiKnowledgeContextCollection } = await import("@/lib/mongodb");
        const collection = await getAiKnowledgeContextCollection();

        // Try exact key first
        const doc = await collection.findOne({ lookup_key: lookupKey });
        if (doc?.payload) {
            console.log(`[MongoCache] HIT: ${lookupKey} (${doc.payload.length} chars)`);
            return doc.payload;
        }

        // Try base key without period suffix (backward compat)
        const baseKey = lookupKey.replace(/_\d+M$/, "");
        if (baseKey !== lookupKey) {
            const baseDoc = await collection.findOne({ lookup_key: baseKey });
            if (baseDoc?.payload) {
                console.log(`[MongoCache] HIT (base): ${baseKey}`);
                return baseDoc.payload;
            }
        }

        console.warn(`[MongoCache] MISS: ${lookupKey}`);
        return null;
    } catch (err) {
        console.error(`[MongoCache] Error:`, err);
        return null;
    }
}
