export const OpgaveStatus = {
    BACKLOG: 'BACKLOG',
    ON_HOLD: 'ON_HOLD',
    TODO: 'TODO',
    IN_PROGRESS: 'IN_PROGRESS',
    TEST: 'TEST',
    DONE: 'DONE',
} as const;

export type OpgaveStatus = typeof OpgaveStatus[keyof typeof OpgaveStatus];

export const OpgavePriority = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    URGENT: 'URGENT',
} as const;

export type OpgavePriority = typeof OpgavePriority[keyof typeof OpgavePriority];

export interface Team {
    id: number;
    navn: string;
    color?: string;
    medlemmer: number[];
}

export type UserRole = 'ADMIN' | 'SUPERUSER' | 'MEMBER';

export interface Company {
    id: string; // UUID
    navn: string;
    cvr?: string;
    slug?: string;
}

export interface WorkspaceMembership {
    id: number;
    company: Company;
    role: UserRole;
    alias?: string;
    color: string;
}

export interface User {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    color?: string;
    role?: UserRole;
    is_active?: boolean;
    teams?: Team[];
    memberships?: WorkspaceMembership[];
    password?: string;
    vidensbank_category_order?: number[];
    language?: string;
}

export interface Opgave {
    id: number;
    titel: string;
    beskrivelse: string;
    status: OpgaveStatus;
    prioritet: OpgavePriority;
    ansvarlige: number[];
    ansvarlige_details?: User[];
    deadline?: string | null;
    kommentarer_count: number;
    oprettet_af: number;
    oprettet_af_details?: User;
    oprettet: string;
    opdateret: string;
    index: number;
    status_direction: number;
    arkiveret: boolean;
    team: number | null;
    team_details?: Team;
    kommentarer?: OpgaveKommentar[];
    status_historik?: any[];
}

export interface OpgaveKommentar {
    id: number;
    opgave: number;
    tekst: string;
    bruger: number;
    bruger_details?: User;
    oprettet: string;
}

export interface VidensKategori {
    id: number;
    navn: string;
    beskrivelse: string | null;
    farve: string;
    artikler_count?: number;
    total_artikler_count?: number;
    er_privat: boolean;
}

export interface Viden {
    id: number;
    titel: string;
    slug: string | null;
    kategori: number;
    kategori_details?: VidensKategori;
    indhold: string;
    link: string | null;
    fil: string | null;
    oprettet_af: number | null;
    oprettet_af_details?: User;
    oprettet: string;
    opdateret: string;
    hjaelp_punkt_ids?: number[];
    arkiveret: boolean;
    slettet: boolean;
    favorit: boolean;
}

export interface HjaelpPunkt {
    id: number;
    kode_navn: string;
    alias: string;
    artikler: number[];
    artikler_details?: Viden[];
}

export interface AarshjulGruppe {
    id: number;
    navn: string;
    raekkefoelge: number;
    teams: number[];
    teams_detail?: Team[];
    oprettet: string;
}

export interface AarshjulAktivitet {
    id: number;
    navn: string;
    beskrivelse: string;
    start_dato: string;
    slut_dato: string;
    farve: string;
    gruppe?: number | null;
    oprettet: string;
    opdateret: string;
}

export type PostEvaluationType = 'GOD_IDE' | 'INGEN_MENING' | 'SEE_COMMENT' | 'LÆST';

export interface PinboardPostEvaluation {
    id: number;
    post: number;
    bruger: number;
    bruger_details?: User;
    evaluering: PostEvaluationType;
    oprettet: string;
}

export interface PinboardPostComment {
    id: number;
    post: number;
    bruger: number;
    bruger_details?: User;
    tekst: string;
    oprettet: string;
}

export interface PinboardPost {
    id: number;
    titel: string;
    beskrivelse: string;
    teaser_text: string;
    oprettet_af: number;
    oprettet_af_details?: User;
    team: number;
    team_details?: Team;
    oprettet: string;
    opdateret: string;
    evalueringer: PinboardPostEvaluation[];
    kommentarer: PinboardPostComment[];
    user_evaluation?: PostEvaluationType | null;
    requires_evaluation: boolean;
    arkiveret: boolean;
    evaluation_summary?: {
        GOD_IDE: number;
        INGEN_MENING: number;
        LÆST: number;
        TOTAL_EVALUATED: number;
        PENDING: number;
        TEAM_TOTAL: number;
    };
}

export interface AppPurpose {
    id: number;
    name: string;
}

export interface AppLink {
    id: number;
    title: string;
    description: string | null;
    path: string;
    teams: number[];
    purposes: number[];
    teams_details?: string[];
    purposes_details?: string[];
    created_at: string;
    updated_at: string;
}

export interface Invitation {
    id: number;
    email: string;
    role: UserRole;
    token: string;
    created_at: string;
}

// Flowchart

export type FlowchartNodeShape = 'rectangle' | 'diamond' | 'oval';

export interface FlowchartNode {
    id: number;
    node_id: string;
    navn: string;
    beskrivelse: string;
    farve: string;
    form_type: FlowchartNodeShape;
    x_pos: number;
    y_pos: number;
    bredde: number;
    hoejde: number;
}

export interface FlowchartEdge {
    id: number;
    edge_id: string;
    source: number;
    target: number;
    source_node_id: string;
    target_node_id: string;
    label: string;
}

export interface Flowchart {
    id: number;
    navn: string;
    beskrivelse: string;
    team: number | null;
    team_details?: { id: number; navn: string; color: string } | null;
    oprettet: string;
    opdateret: string;
    nodes: FlowchartNode[];
    edges: FlowchartEdge[];
}
