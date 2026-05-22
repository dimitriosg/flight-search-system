// Cliente HTTP fino para as rotas de API. Devolve sempre o envelope padrão.

export interface ApiResp<T> {
  ok: boolean;
  data?: T;
  error?: string;
  campos?: Record<string, string>;
}

async function req<T>(
  url: string,
  method: string,
  body?: unknown,
): Promise<ApiResp<T>> {
  try {
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    return (await res.json()) as ApiResp<T>;
  } catch {
    return { ok: false, error: "Falha de rede." };
  }
}

export const getJSON = <T>(url: string) => req<T>(url, "GET");
export const postJSON = <T>(url: string, body: unknown) =>
  req<T>(url, "POST", body);
export const patchJSON = <T>(url: string, body: unknown) =>
  req<T>(url, "PATCH", body);
export const delJSON = <T>(url: string) => req<T>(url, "DELETE");
