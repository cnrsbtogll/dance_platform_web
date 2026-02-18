export interface Partner {
    id: string;
    ad: string;
    yas: number;
    cinsiyet: string;
    seviye: string;
    dans: string[];
    konum: string;
    saatler: string[];
    foto: string;
    puan: number;
    relevanceScore?: number;
    boy?: number;
    kilo?: number;
    role?: string | string[];
}
