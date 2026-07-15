import React, { useState, useEffect, useCallback } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { useDropzone } from 'react-dropzone';
import type { Viden, VidensKategori } from '../../types';
import { api } from '../../api';
import Modal from '../Modal';
import { X, Upload, Link as LinkIcon, FileText, Loader2, Save, Star, Archive } from 'lucide-react';
import { Quill } from 'react-quill-new';
import { useTranslation } from '../../services/translationService';

// @# 2024-03-20 - Tving Quill til at acceptere 'style' og 'width' på tabel-celler
const Style = Quill.import('attributors/style/width') as any;
if (Style) {
    Quill.register(Style, true);
}

const TableCell = Quill.import('formats/table-cell') as any;
if (TableCell) {
    // Tillad 'width' som en gyldig attribut i Quills interne model
    const oldFormats = TableCell.formats;
    TableCell.formats = function (domNode: HTMLElement) {
        const formats = oldFormats(domNode) || {};
        if (domNode.hasAttribute('width')) {
            formats.width = domNode.getAttribute('width');
        } else if (domNode.style.width) {
            formats.width = domNode.style.width;
        }
        return formats;
    };
    Quill.register(TableCell, true);
}

interface VidensbankModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    editingViden?: Viden;
    kategorier: VidensKategori[];
    showToast: (message: string, type?: any) => void;
}

const VidensbankModal: React.FC<VidensbankModalProps> = ({ isOpen, onClose, onSave, editingViden, kategorier, showToast }) => {
    const { t } = useTranslation();
    const [titel, setTitel] = useState('');
    const [kategori, setKategori] = useState<number | ''>('');
    const [indhold, setIndhold] = useState('');
    const [link, setLink] = useState('');
    const [fil, setFil] = useState<File | null>(null);
    const [eksisterendeFil, setEksisterendeFil] = useState<string | null>(null);
    const [arkiveret, setArkiveret] = useState(false);
    const [favorit, setFavorit] = useState(false);
    const [isSaving, setIsSaving] = useState(false);


    useEffect(() => {
        if (isOpen) {
            if (editingViden) {
                setTitel(editingViden.titel);
                setKategori(editingViden.kategori);
                setIndhold(editingViden.indhold || '');
                setLink(editingViden.link || '');
                setEksisterendeFil(editingViden.fil);
                setArkiveret(editingViden.arkiveret);
                setFavorit(editingViden.favorit);
                setFil(null);
            } else {
                setTitel('');
                setKategori('');
                setIndhold('');
                setLink('');
                setFil(null);
                setEksisterendeFil(null);
                setArkiveret(false);
                setFavorit(false);
            }
        }
    }, [editingViden, isOpen]);

    const handleSave = async () => {
        // @# 2024-03-20 - Vigtigt: Træk indholdet direkte fra Quill-editoren ved gemning.
        const editor = quillRef.current?.getEditor();
        if (!editor) return;

        // "Fastfrys" kolonnebredder: Gennemgå alle TD'er og konverter deres 'style.width' (fra resize) 
        // til en permanent 'width' attribut, som Quill og databasen ikke smider væk.
        const tdElements = editor.root.querySelectorAll('td');
        tdElements.forEach((td: HTMLElement) => {
            if (td.style.width) {
                td.setAttribute('width', td.style.width);
            }
        });

        const currentContent = editor.root.innerHTML;

        if (!titel || !kategori || !currentContent) {
            showToast("Udfyld venligst titel, kategori og indhold.", "info");
            return;
        }

        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append('titel', titel);
            formData.append('kategori', kategori.toString());
            formData.append('indhold', currentContent);
            formData.append('link', link);
            if (fil) {
                formData.append('fil', fil);
            }
            formData.append('arkiveret', arkiveret.toString());
            formData.append('favorit', favorit.toString());


            if (editingViden) {
                await api.patch(`/vidensbank/artikler/${editingViden.id}/`, formData);
            } else {
                await api.post('/vidensbank/artikler/', formData);
            }
            onSave();
            showToast(editingViden ? "Artikel opdateret" : "Artikel oprettet", "success");
        } catch (error) {
            console.error("Fejl ved gemning af viden", error);
            showToast("Der opstod en fejl ved gemning.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const headerActions = (
        <div className="flex gap-2 mr-2">
            <button
                onClick={onClose}
                className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg font-medium text-sm transition-colors"
                disabled={isSaving}
            >
                {t('common.cancel', 'Cancel')}
            </button>
            <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 shadow-md font-bold flex items-center gap-2 disabled:bg-blue-400 text-sm transition-all"
            >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {t('vidensbank.modal.save', 'Save article')}
            </button>
        </div>
    );

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFil(acceptedFiles[0]);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false
    });

    const quillModules = {
        toolbar: {
            container: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                [{ 'indent': '-1' }, { 'indent': '+1' }],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'align': [] }],
                ['link', 'image', 'table'], // @# Added 'table'
                ['clean']
            ],
        },
        table: true // @# Enable table module
    };

    const quillRef = React.useRef<any>(null);

    const handleTableAction = (action: string) => {
        const quill = quillRef.current?.getEditor();
        const table = quill?.getModule('table');
        if (!table) return;

        switch (action) {
            case 'insert-row-above': table.insertRowAbove(); break;
            case 'insert-row-below': table.insertRowBelow(); break;
            case 'insert-column-left': table.insertColumnLeft(); break;
            case 'insert-column-right': table.insertColumnRight(); break;
            case 'delete-row': table.deleteRow(); break;
            case 'delete-column': table.deleteColumn(); break;
            case 'delete-table': table.deleteTable(); break;
            default: break;
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editingViden ? t('vidensbank.modal.edit_title', 'Edit knowledge') : t('vidensbank.modal.add_title', 'Add new knowledge')}
            wide
            headerActions={headerActions}
        >
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1 text-left">
                        <label htmlFor="modal-titel" className="text-xs font-bold text-gray-500 uppercase">{t('vidensbank.modal.title_label', 'Title')}</label>
                        <input
                            id="modal-titel"
                            type="text"
                            value={titel}
                            onChange={(e) => setTitel(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm"
                            placeholder={t('vidensbank.modal.title_placeholder', 'Enter a descriptive title...')}
                        />
                    </div>
                    <div className="flex flex-col gap-1 text-left">
                        <label htmlFor="modal-kategori" className="text-xs font-bold text-gray-500 uppercase">{t('vidensbank.modal.category_label', 'Category')}</label>
                        <select
                            id="modal-kategori"
                            value={kategori}
                            onChange={(e) => setKategori(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white text-sm"
                        >
                            <option value="">{t('vidensbank.modal.select_category', 'Select category...')}</option>
                            {kategorier.map(kat => (
                                <option key={kat.id} value={kat.id}>{kat.navn}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex gap-6 items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={favorit}
                            onChange={(e) => setFavorit(e.target.checked)}
                            className="w-4 h-4 text-amber-500 rounded border-gray-300 focus:ring-amber-500"
                        />
                        <div className="flex items-center gap-1.5">
                            <Star size={16} className={favorit ? "text-amber-500 fill-amber-500" : "text-gray-400"} />
                            <span className="text-sm font-bold text-gray-700 group-hover:text-amber-600 transition-colors">{t('vidensbank.modal.favorite', 'Important / Favorite')}</span>
                        </div>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={arkiveret}
                            onChange={(e) => setArkiveret(e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <div className="flex items-center gap-1.5">
                            <Archive size={16} className={arkiveret ? "text-blue-600" : "text-gray-400"} />
                            <span className="text-sm font-bold text-gray-700 group-hover:text-blue-600 transition-colors">{t('vidensbank.modal.archived', 'Archived')}</span>
                        </div>
                    </label>
                </div>

                <div className="flex flex-col gap-1 text-left">
                    <div className="flex justify-between items-end mb-1 sticky top-[-24px] bg-white z-20 py-1 border-b border-gray-100">
                        <label className="text-xs font-bold text-gray-500 uppercase">{t('vidensbank.modal.content_label', 'Content')}</label>
                        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-md border border-gray-200 shadow-sm">
                            <span className="text-[10px] font-bold text-gray-400 px-2 uppercase">{t('vidensbank.modal.table_tools', 'Table tools:')}</span>
                            <button
                                onClick={() => handleTableAction('insert-row-below')}
                                className="px-2 py-1 text-[10px] bg-white border border-gray-300 rounded hover:bg-blue-50 hover:text-blue-600 transition-colors font-bold"
                                title={t('vidensbank.modal.table.insert_row_below', 'Insert row below')}
                            >
                                {t('vidensbank.modal.table.add_row', '+ Row')}
                            </button>
                            <button
                                onClick={() => handleTableAction('insert-column-right')}
                                className="px-2 py-1 text-[10px] bg-white border border-gray-300 rounded hover:bg-blue-50 hover:text-blue-600 transition-colors font-bold"
                                title={t('vidensbank.modal.table.insert_col_right', 'Insert column right')}
                            >
                                {t('vidensbank.modal.table.add_col', '+ Column')}
                            </button>
                            <div className="w-px h-4 bg-gray-300 mx-1"></div>
                            <button
                                onClick={() => handleTableAction('delete-row')}
                                className="px-2 py-1 text-[10px] bg-white border border-gray-300 rounded hover:bg-red-50 hover:text-red-600 transition-colors font-bold"
                                title={t('vidensbank.modal.table.delete_row', 'Delete row')}
                            >
                                {t('vidensbank.modal.table.remove_row', '- Row')}
                            </button>
                            <button
                                onClick={() => handleTableAction('delete-column')}
                                className="px-2 py-1 text-[10px] bg-white border border-gray-300 rounded hover:bg-red-50 hover:text-red-600 transition-colors font-bold"
                                title={t('vidensbank.modal.table.delete_col', 'Delete column')}
                            >
                                {t('vidensbank.modal.table.remove_col', '- Column')}
                            </button>
                            <button
                                onClick={() => handleTableAction('delete-table')}
                                className="px-2 py-1 text-[10px] bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-bold ml-2"
                                title={t('vidensbank.modal.table.delete_table_title', 'DELETE ENTIRE TABLE')}
                            >
                                {t('vidensbank.modal.table.delete_table', 'Delete table')}
                            </button>
                        </div>
                    </div>
                    <div
                        className="border border-gray-300 rounded-lg flex flex-col min-h-[400px]"
                        onDrop={async (e) => {
                            const file = Array.from(e.dataTransfer.files).find(f =>
                                f.name.toLowerCase().match(/\.(docx|txt|md|csv|xlsx|xls)$/)
                            );
                            if (file) {
                                e.preventDefault();
                                e.stopPropagation();
                                try {
                                    const ext = file.name.slice((file.name.lastIndexOf(".") - 1 >>> 0) + 2).toLowerCase();
                                    let htmlToInsert = '';
                                    let textToInsert = '';
                                    let potentialTitle = '';

                                    if (ext === 'docx') {
                                        const arrayBuffer = await file.arrayBuffer();
                                        const result = await mammoth.convertToHtml({ arrayBuffer });
                                        if (result.messages && result.messages.length > 0) {
                                            console.warn("Word-dokument advarsler:", result.messages);
                                        }
                                        htmlToInsert = result.value;

                                        // Forsøg at udtrække en titel fra første linje i Word-dokumentet
                                        try {
                                            const textResult = await mammoth.extractRawText({ arrayBuffer });
                                            const firstLine = textResult.value.split('\n').find((l: string) => l.trim().length > 0);
                                            if (firstLine) potentialTitle = firstLine.trim();
                                        } catch (e) {
                                            console.error("Kunne ikke udtrække rå tekst fra Word", e);
                                        }

                                    } else if (ext === 'txt' || ext === 'md') {
                                        textToInsert = await file.text();
                                        const firstLine = textToInsert.split('\n').find((l: string) => l.trim().length > 0);
                                        if (firstLine) potentialTitle = firstLine.trim();

                                    } else if (ext === 'csv' || ext === 'xlsx' || ext === 'xls') {
                                        const arrayBuffer = await file.arrayBuffer();
                                        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                                        const firstSheetName = workbook.SheetNames[0];
                                        const worksheet = workbook.Sheets[firstSheetName];
                                        htmlToInsert = XLSX.utils.sheet_to_html(worksheet);

                                        // For Excel/CSV tager vi indholdet af første celle som potentiel titel
                                        // da første række ofte er overskriften
                                        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
                                        if (json.length > 0 && json[0].length > 0 && json[0][0]) {
                                            potentialTitle = String(json[0][0]).trim();
                                        }
                                    }

                                    // Auto-udfyld titel hvis den er blank
                                    if (!titel && potentialTitle) {
                                        // Begræns titlen til en rimelig længde
                                        setTitel(potentialTitle.slice(0, 150));
                                    }

                                    const editor = quillRef.current?.getEditor();
                                    if (editor) {
                                        const range = editor.getSelection();
                                        const position = range ? range.index : editor.getLength();

                                        if (htmlToInsert) {
                                            editor.clipboard.dangerouslyPasteHTML(position, htmlToInsert);
                                        } else if (textToInsert) {
                                            editor.insertText(position, textToInsert);
                                        }
                                    }
                                } catch (err) {
                                    console.error("Fejl ved indlæsning af fil:", err);
                                    showToast("Kunne ikke indlæse filen. Sørg for at det er et gyldigt format.", "error");
                                }
                            }
                        }}
                        onDragOver={(e) => {
                            if (e.dataTransfer.types.includes('Files')) {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = 'copy';
                            }
                        }}
                    >
                        <ReactQuill
                            ref={quillRef}
                            theme="snow"
                            placeholder="Skriv din tekst her eller træk filer (.docx, .txt, .md, .csv, excel) hertil..."
                            value={indhold}
                            onChange={(content) => setIndhold(content)}
                            modules={quillModules}
                            className="flex-1 flex flex-col vidensbank-editor-rich-text [&>.ql-container]:flex-1 [&>.ql-container]:overflow-visible [&>.ql-editor]:min-h-[350px]"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1 text-left">
                        <label htmlFor="modal-link" className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                            <LinkIcon size={12} />
                            Eksternt Link
                        </label>
                        <input
                            id="modal-link"
                            type="text"
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm"
                            placeholder="https://..."
                        />
                    </div>

                    <div className="flex flex-col gap-1 text-left">
                        <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                            <Upload size={12} />
                            Vedhæft dokument
                        </label>
                        <div
                            {...getRootProps()}
                            className={`flex-1 border-2 border-dashed rounded-lg p-2 transition-colors flex items-center justify-center cursor-pointer min-h-[42px] ${isDragActive ? 'bg-blue-50 border-blue-400' : 'bg-gray-50 border-gray-200 hover:border-blue-300'}`}
                        >
                            <input {...getInputProps()} />
                            {fil ? (
                                <div className="flex items-center gap-2 text-xs text-blue-600">
                                    <FileText size={14} />
                                    <span className="truncate max-w-[150px] font-medium">{fil.name}</span>
                                    <button onClick={(e) => { e.stopPropagation(); setFil(null); }} className="text-red-500 hover:bg-red-50 p-1 rounded">
                                        <X size={12} />
                                    </button>
                                </div>
                            ) : eksisterendeFil ? (
                                <div className="flex items-center gap-2 text-xs text-green-600">
                                    <FileText size={14} />
                                    <span className="truncate max-w-[150px] font-medium">Fil er uploadet</span>
                                    <span className="text-[9px] bg-green-50 px-1 py-0.5 rounded text-green-700">Klik/drag for ny</span>
                                </div>
                            ) : (
                                <div className="text-[10px] text-gray-400 text-center">
                                    {isDragActive ? 'Slip her' : 'Klik eller træk fil hertil'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </Modal>
    );
};

export default VidensbankModal;
