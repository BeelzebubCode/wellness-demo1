// src/components/ui/ConfirmDialog.tsx
"use client";

import { useState, useCallback, createContext, useContext, type ReactNode } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";

/* ─────────── Types ─────────── */

type DialogVariant = "confirm" | "danger" | "success" | "info";

type DialogOptions = {
    title: string;
    message: string;
    variant?: DialogVariant;
    confirmLabel?: string;
    cancelLabel?: string;
    /** If true, only show a single OK button (like alert) */
    alert?: boolean;
};

type DialogState = DialogOptions & {
    resolve: (value: boolean) => void;
};

/* ─────────── Variant Config ─────────── */

const VARIANT_CONFIG: Record<
    DialogVariant,
    {
        icon: typeof Info;
        iconBg: string;
        iconColor: string;
        confirmBtnClass: string;
    }
> = {
    confirm: {
        icon: Info,
        iconBg: "bg-primary-100",
        iconColor: "text-primary-600",
        confirmBtnClass: "bg-primary-600 hover:bg-primary-700 text-white",
    },
    danger: {
        icon: AlertTriangle,
        iconBg: "bg-red-100",
        iconColor: "text-red-600",
        confirmBtnClass: "bg-red-600 hover:bg-red-700 text-white",
    },
    success: {
        icon: CheckCircle2,
        iconBg: "bg-green-100",
        iconColor: "text-green-600",
        confirmBtnClass: "bg-green-600 hover:bg-green-700 text-white",
    },
    info: {
        icon: Info,
        iconBg: "bg-blue-100",
        iconColor: "text-blue-600",
        confirmBtnClass: "bg-blue-600 hover:bg-blue-700 text-white",
    },
};

/* ─────────── Context ─────────── */

type ConfirmDialogContextValue = {
    confirm: (opts: DialogOptions) => Promise<boolean>;
    alert: (opts: Omit<DialogOptions, "alert">) => Promise<void>;
};

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(null);

export function useConfirmDialog() {
    const ctx = useContext(ConfirmDialogContext);
    if (!ctx) throw new Error("useConfirmDialog must be used within <ConfirmDialogProvider>");
    return ctx;
}

/* ─────────── Provider ─────────── */

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
    const [dialog, setDialog] = useState<DialogState | null>(null);
    const [loading, setLoading] = useState(false);

    const showDialog = useCallback((opts: DialogOptions) => {
        return new Promise<boolean>((resolve) => {
            setDialog({ ...opts, resolve });
        });
    }, []);

    const confirm = useCallback(
        (opts: DialogOptions) => showDialog(opts),
        [showDialog]
    );

    const alertFn = useCallback(
        async (opts: Omit<DialogOptions, "alert">) => {
            await showDialog({ ...opts, alert: true });
        },
        [showDialog]
    );

    const handleClose = (result: boolean) => {
        dialog?.resolve(result);
        setDialog(null);
        setLoading(false);
    };

    const variant = dialog?.variant ?? "confirm";
    const cfg = VARIANT_CONFIG[variant];
    const Icon = cfg.icon;

    return (
        <ConfirmDialogContext.Provider value={{ confirm, alert: alertFn }}>
            {children}

            <Modal
                open={!!dialog}
                onOpenChange={(open) => {
                    if (!open) handleClose(false);
                }}
                size="sm"
                showCloseButton={false}
                closeOnOverlayClick={false}
            >
                {dialog && (
                    <div className="flex flex-col items-center text-center py-2">
                        {/* Icon */}
                        <div
                            className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${cfg.iconBg}`}
                        >
                            <Icon className={`w-7 h-7 ${cfg.iconColor}`} />
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                            {dialog.title}
                        </h3>

                        {/* Message */}
                        <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
                            {dialog.message}
                        </p>

                        {/* Buttons */}
                        <div className="flex items-center gap-3 mt-6 w-full">
                            {!dialog.alert && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 rounded-xl"
                                    onClick={() => handleClose(false)}
                                >
                                    {dialog.cancelLabel ?? "ยกเลิก"}
                                </Button>
                            )}
                            <Button
                                size="sm"
                                className={`flex-1 rounded-xl shadow-sm ${cfg.confirmBtnClass}`}
                                onClick={() => handleClose(true)}
                            >
                                {dialog.alert
                                    ? (dialog.confirmLabel ?? "ตกลง")
                                    : (dialog.confirmLabel ?? "ยืนยัน")}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </ConfirmDialogContext.Provider>
    );
}
