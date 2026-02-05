// src/services/borrowRequests/index.ts

export * from "./types";
export * from "./validators";
export * from "./helpers";

// ===== handlers (explicit export) =====
export { createBorrowRequest } from "./handlers/createBorrowRequest";
export { getBorrowRequest } from "./handlers/getBorrowRequest";
export { listMyBorrowRequests } from "./handlers/listMyBorrowRequests";

export { platformListBorrowRequests } from "./handlers/platformListBorrowRequests";
export { platformApproveBorrowRequest } from "./handlers/platformApproveBorrowRequest";
export { platformAssignBorrowRequest } from "./handlers/platformAssignBorrowRequest";
export { platformListBorrowCandidates } from "./handlers/platformListBorrowCandidates";
export { consultantListBorrowedAssignments } from "./handlers/consultantListBorrowedAssignments";

export { submitBorrowRequest } from "./handlers/submitBorrowRequest";
