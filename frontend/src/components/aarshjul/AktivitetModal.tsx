import React, { useState, useEffect } from 'react';
import { X, Calendar, Type, FileText, Palette, Save, Layers } from 'lucide-react';
import type { Aktivitet } from '../../services/aarshjulService';
import { aarshjulService } from '../../services/aarshjulService';
import { useAppState } from '../../StateContext';
import { useTranslation } from '../../services/translationService';
import dayjs from 'dayjs';

interface AktivitetModalProps {
    isOpen: boolean;
    onClose: () => void;
    aktivitet?: Aktivitet;
    onSaved: () => void;
}

const AktivitetModal: React.FC<AktivitetModalProps> = ({ isOpen, onClose, aktivitet, onSaved }) => {
    const { state } = useAppState();
    const { t } = useTranslation();
    const [formData, setFormData] = useState<Partial<Aktivitet>>({
        navn: '',
        beskrivelse: '',
        start_dato: dayjs().format('YYYY-MM-DD'),
        slut_dato: dayjs().add(7, 'day').format('YYYY-MM-DD'),
        farve: '#3b82f6',
        gruppe: null
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (aktivitet) {
            setFormData({
                ...aktivitet,
                gruppe: aktivitet.gruppe || null
            });
        } else {
            // Find default group (lowest raekkefoelge)
            const defaultGroup = state.aarshjulGrupper.length > 0
                ? [...state.aarshjulGrupper].sort((a, b) => a.raekkefoelge - b.raekkefoelge)[0]
                : null;

            setFormData({
                navn: '',
                beskrivelse: '',
                start_dato: dayjs().format('YYYY-MM-DD'),
                slut_dato: dayjs().add(7, 'day').format('YYYY-MM-DD'),
                farve: '#3b82f6',
                gruppe: defaultGroup ? defaultGroup.id : null
            });
        }
    }, [aktivitet, isOpen, state.aarshjulGrupper]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (aktivitet?.id) {
                await aarshjulService.update(aktivitet.id, formData);
            } else {
                await aarshjulService.create(formData);
            }
            onSaved();
            onClose();
        } catch (error) {
            console.error("Failed to save aktivitet:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!aktivitet?.id) return;
        if (!window.confirm(t('aarshjul.modal.delete_confirm', 'Er du sikker på at du vil slette denne aktivitet?'))) return;

        try {
            await aarshjulService.delete(aktivitet.id);
            onSaved();
            onClose();
        } catch (error) {
            console.error("Failed to delete aktivitet:", error);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 bg-gray-50 border-b flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800">
                        {aktivitet ? t('aarshjul.edit_activity', 'Rediger Aktivitet') : t('aarshjul.new_activity', 'Ny Aktivitet')}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-2">
                            <Type size={14} /> {t('aarshjul.modal.name', 'Navn')}
                        </label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            value={formData.navn}
                            onChange={e => setFormData({ ...formData, navn: e.target.value })}
                            placeholder={t('aarshjul.modal.name_placeholder', 'Aktivitetens navn')}
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-2">
                            <Layers size={14} /> {t('aarshjul.modal.group', 'Gruppe')}
                        </label>
                        <select
                            className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            value={formData.gruppe || ''}
                            onChange={e => setFormData({ ...formData, gruppe: e.target.value ? Number(e.target.value) : null })}
                        >
                            {state.aarshjulGrupper.length === 0 && <option value="">{t('aarshjul.modal.no_groups', 'Ingen grupper oprettet')}</option>}
                            {state.aarshjulGrupper.map(g => (
                                <option key={g.id} value={g.id}>{g.navn}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-2">
                            <FileText size={14} /> {t('aarshjul.modal.description', 'Beskrivelse')}
                        </label>
                        <textarea
                            className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all min-h-[100px]"
                            value={formData.beskrivelse}
                            onChange={e => setFormData({ ...formData, beskrivelse: e.target.value })}
                            placeholder={t('aarshjul.modal.description_placeholder', 'Kort beskrivelse...')}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-2">
                                <Calendar size={14} /> {t('aarshjul.modal.start_date', 'Startdato')}
                            </label>
                            <input
                                type="date"
                                required
                                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                value={formData.start_dato}
                                onChange={e => setFormData({ ...formData, start_dato: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-2">
                                <Calendar size={14} /> {t('aarshjul.modal.end_date', 'Slutdato')}
                            </label>
                            <input
                                type="date"
                                required
                                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                value={formData.slut_dato}
                                onChange={e => setFormData({ ...formData, slut_dato: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-2">
                            <Palette size={14} /> {t('aarshjul.modal.color', 'Farve')}
                        </label>
                        <div className="flex items-center">
                            <input
                                type="color"
                                className="w-8 h-8 rounded-lg cursor-pointer border border-gray-300 p-0 overflow-hidden bg-transparent"
                                value={formData.farve}
                                onChange={e => setFormData({ ...formData, farve: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex items-center justify-between border-t gap-4">
                        {aktivitet && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl font-bold transition-colors"
                            >
                                {t('aarshjul.modal.delete', 'Slet')}
                            </button>
                        )}
                        <div className="flex gap-3 ml-auto">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2 border rounded-xl font-bold hover:bg-gray-50 transition-colors"
                            >
                                {t('aarshjul.modal.cancel', 'Annuller')}
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                <Save size={18} />
                                {isSaving ? t('aarshjul.modal.saving', 'Gemmer...') : t('aarshjul.modal.save', 'Gem Aktivitet')}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AktivitetModal;
