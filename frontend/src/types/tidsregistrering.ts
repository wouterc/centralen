export interface OpgaverKode {
    id: number;
    kode_nr: string;
    beskrivelse: string;
    mtime: string | null;
    gruppe: string | null;
    gruppe_navn: string | null;
}

export interface KoderGrupper {
    id: number;
    gruppe: string;
    beskrivelse: string | null;
}

export interface Tidreg {
    id: number;
    bruger: number;
    bruger_name: string;
    opgave_kode: number;
    kode_nr: string;
    beskrivelse: string;
    mtime: string | null;
    gruppe: string | null;
    alias: string | null;
    fra_tid: string;
    til_tid: string | null;
    tid: string | null;
    kommentar: string | null;
    aktiv: boolean;
}

export interface BrugerProfilTime {
    id: number;
    bruger: number;
    opgave_kode: number;
    kode_nr: string;
    beskrivelse: string;
    alias: string | null;
    sortering: number | null;
}

export interface BrugerIndstillingTime {
    id: number;
    bruger: number;
    window_x: number | null;
    window_y: number | null;
    window_width: number | null;
    window_height: number | null;
}
