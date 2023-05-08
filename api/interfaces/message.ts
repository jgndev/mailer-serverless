export interface Message {
    to: string,
    from: string,
    name: string,
    phone: string | null,
    subject: string,
    message: string,
    text: string,
    html: string,
}