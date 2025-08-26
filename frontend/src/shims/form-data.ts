// Minimal browser shim for 'form-data' to satisfy OpenAPI axios client in Vite
const WebFormData: typeof FormData = (globalThis as any).FormData;
export default WebFormData as any;
