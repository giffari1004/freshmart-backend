import { z } from "zod";

/**
 * GET /authorization/session tidak menerima input apapun dari client
 * (userId diambil dari req.user hasil authMiddleware, bukan dari
 * body/query/params) — jadi tidak ada yang perlu divalidasi di sini.
 *
 * File ini tetap ada (kosong secara sengaja) untuk konsistensi struktur
 * antar feature, dan sebagai tempat menaruh schema baru kalau nanti
 * endpoint di feature ini bertambah dan butuh input.
 */
export class AuthorizationValidation {}
