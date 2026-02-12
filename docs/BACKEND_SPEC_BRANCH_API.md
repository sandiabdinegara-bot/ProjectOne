# Backend API Spec: Cabang (Branch) – Pagination, Filtering, Export & Print

This document describes the API contract expected by the **Branch Management** frontend for list (with pagination and filtering), export, and print. The frontend uses `BASE_URL` from config (e.g. `VITE_BASE_URL`) and appends the paths below.

**Base path for all endpoints:** `{BASE_URL}/cabang`

---

## 1. List with pagination and filtering

**Endpoint:** `GET /cabang`

**Purpose:** Return a paginated, optionally filtered list of branches (cabang).

### Query parameters

| Parameter | Type   | Required | Default | Description |
|-----------|--------|----------|---------|-------------|
| `page`    | number | No       | 1       | Page number (1-based). |
| `limit`   | number | No       | 10      | Number of items per page (e.g. 10, 25, 50, 100). |
| `search`  | string | No       | -       | Search term. Backend should filter branches where **any** of these fields (case-insensitive, partial match) contain the term: `kode_cabang`, `cabang`, `alamat`, `telepon`. |

### Response body (JSON)

Return a **single JSON object** (not a bare array) with this shape:

```json
{
  "data": [
    {
      "id": 1,
      "kode_cabang": "10",
      "cabang": "Nama Cabang",
      "alamat": "Alamat lengkap",
      "telepon": "0234-123456"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

| Field        | Type   | Description |
|-------------|--------|-------------|
| `data`      | array  | List of branch objects for the requested page. |
| `total`     | number | Total number of branches matching the current filter (search). |
| `page`      | number | Current page number (same as request `page`). |
| `limit`     | number | Page size used (same as request `limit`). |
| `totalPages`| number | Total number of pages: `ceil(total / limit)`. |

**Branch object** must include at least: `id`, `kode_cabang`, `cabang`, `alamat`, `telepon` (same as existing cabang CRUD).

**Backward compatibility:** If the backend cannot support this format yet, returning a **plain array** of all branches is still supported by the frontend (no pagination then; frontend treats it as a single page).

---

## 2. Export (CSV, Excel, PDF)

**Endpoint:** `GET /cabang/export`

**Purpose:** Generate and return a file (CSV, XLSX, or PDF) of branches using the **same filtering** as the list API (so export is consistent with what the user sees when they filter).

### Query parameters

| Parameter | Type   | Required | Description |
|-----------|--------|----------|-------------|
| `format`  | string | Yes      | One of: `csv`, `xlsx`, `pdf`. |
| `search`  | string | No       | Same as in list API. Apply the same search filter before exporting. |
| `columns` | string | No       | Comma-separated column IDs to include, e.g. `kode_cabang,cabang,alamat,telepon`. If omitted, include all columns. Allowed IDs: `kode_cabang`, `cabang`, `alamat`, `telepon`. |

### Response

- **Status:** `200 OK`
- **Body:** Binary file content.
- **Headers:**
  - `Content-Type`:
    - CSV: `text/csv; charset=utf-8`
    - XLSX: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
    - PDF: `application/pdf`
  - `Content-Disposition: attachment; filename="data_cabang_YYYY-MM-DD.csv"` (or `.xlsx` / `.pdf`). Use a safe filename with date (e.g. `data_cabang_2025-02-12.csv`).

Export must apply the same search semantics as the list endpoint (filter by `kode_cabang`, `cabang`, `alamat`, `telepon`). Export should return **all matching rows** (no pagination).

---

## 3. Print

**Purpose:** The frontend “Print” action opens a PDF in a new tab so the user can print from the browser. The same filtered dataset as the list should be used.

**Implementation:** Use the **same export endpoint** with `format=pdf` and the same `search` (and optionally `columns`) as the current list view. The frontend calls:

- `GET /cabang/export?format=pdf&print=1&search=...`

So no separate “print” endpoint is required; backend only needs to support the export endpoint above. Optional query `print=1` can be ignored or used to adjust layout (e.g. for print-friendly margins).

---

## 4. Summary for backend

| Feature     | Method | Path           | Main parameters              | Response / behavior |
|------------|--------|----------------|------------------------------|----------------------|
| List       | GET    | `/cabang`      | `page`, `limit`, `search`    | JSON: `{ data, total, page, limit, totalPages }` |
| Export CSV | GET    | `/cabang/export`| `format=csv`, `search`, `columns` | File download (CSV) |
| Export XLSX| GET    | `/cabang/export`| `format=xlsx`, `search`, `columns` | File download (XLSX) |
| Export PDF | GET    | `/cabang/export`| `format=pdf`, `search`, `columns` | File download (PDF) |
| Print      | -      | Same as Export PDF | Frontend uses export PDF with current filters. | Open in new tab for print. |

---

## 5. Column IDs for export

When `columns` is sent, use these field names for the export content:

| Column ID     | Suggested header (Indonesian) |
|---------------|--------------------------------|
| `kode_cabang` | Kode Cabang                    |
| `cabang`      | Nama Cabang                    |
| `alamat`      | Alamat                         |
| `telepon`     | Telepon                        |

Order of columns in the export should follow the order in the `columns` query parameter (comma-separated list).

---

## 6. CORS and auth

- Ensure CORS allows the frontend origin if it is different from the API origin.
- If the app uses auth (e.g. Bearer token), the frontend will send the same credentials/headers for these requests; backend should accept them as for other cabang endpoints.

---

*Document generated for backend implementation. Frontend: Branch Management – pagination, export, print, and filtering are driven by these APIs.*
