export interface Message {
    to: string,
    from: string,
    phone: string | null,
    subject: string,
    text: string,
    html: string,
}