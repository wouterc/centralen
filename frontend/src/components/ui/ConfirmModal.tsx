import React, { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import Button from './Button';
import { useTranslation } from 'react-i18next';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void | Promise<void>;
    title: string;
    message: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText,
    cancelText,
    isDestructive = false,
}) => {
    const { t } = useTranslation();
    const finalCancelText = cancelText || t('common.cancel', 'Cancel');
    const finalConfirmText = confirmText || t('common.confirm', 'Confirm');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isLoading) return;

        setIsLoading(true);
        try {
            const result = onConfirm();
            if (result instanceof Promise) {
                await result;
            }
        } catch (error) {
            console.error("Fejl i bekræftelse:", error);
        } finally {
            setIsLoading(false);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
            {/* Backdrop layer - ensures it's behind and clickable to close */}
            <div
                className="absolute inset-0 bg-slate-900/70 backdrop-blur-md transition-opacity duration-300"
                onClick={!isLoading ? onClose : undefined}
            ></div>

            {/* Modal Content - forced on top with z-10 and relative */}
            <div className="relative z-10 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] transform transition-all sm:max-w-lg w-full border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-white px-6 pt-6 pb-4 sm:p-8 sm:pb-6">
                    <div className="sm:flex sm:items-start">
                        <div className={`mx-auto shrink-0 flex items-center justify-center h-14 w-14 rounded-2xl ${isDestructive ? 'bg-red-50' : 'bg-blue-50'} sm:mx-0 sm:h-12 sm:w-12 shadow-sm`}>
                            <AlertTriangle className={`h-6 w-6 ${isDestructive ? 'text-red-600' : 'text-blue-600'}`} aria-hidden="true" />
                        </div>
                        <div className="mt-4 text-center sm:mt-0 sm:ml-5 sm:text-left">
                            <h3 className="text-xl leading-6 font-black text-gray-900" id="modal-title">
                                {title}
                            </h3>
                            <div className="mt-3 text-sm text-gray-600 leading-relaxed font-medium">
                                {message}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 sm:px-8 sm:flex sm:flex-row-reverse gap-3 border-t border-gray-100">
                    <Button
                        variant={isDestructive ? 'danger' : 'primary'}
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className="w-full sm:w-auto font-black px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                    >
                        {isLoading ? (
                            <Loader2 className="animate-spin mr-2" size={18} />
                        ) : null}
                        {finalConfirmText}
                    </Button>
                    {!isLoading && (
                        <Button
                            variant="secondary"
                            onClick={onClose}
                            className="mt-3 sm:mt-0 w-full sm:w-auto font-bold px-6 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-all"
                        >
                            {finalCancelText}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
