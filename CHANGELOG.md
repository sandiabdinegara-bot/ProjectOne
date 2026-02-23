# Changelog

## [1.2.0] - 2026-02-23

### Added
- **"Terverifikasi" Filter**: New OCR status filter in Report ABM to isolate manually verified records (based on `tgl_verifikasi`).
- **Three-Button Export**: Dedicated buttons for PDF, EXCEL, and CSV in the report modal with professional corporate styling and Lucide icons.
- **CSV Export API**: New backend script `api/ocr_report_csv.php` for seamless data export to spreadsheet applications.

### Changed
- **Interactive Dashboard KPI**: Re-layout main metrics into 4 consolidated summary cards with interactive drill-down functionality (direct navigation or detail modal).
- **Professional UI Refinement**: Updated export interface with solid corporate colors and standardized document icons for a premium enterprise feel.

### Fixed
- **Backend Filter Synchronization**: Updated `ocr_report_pdf.php` and `ocr_report_csv.php` to correctly handle the "Terverifikasi" status logic.
- **KPI Card Layout**: Fixed grid spacing and responsiveness for the summary section.


## [0.0.8] - 2026-02-18

### Fixed
- **Global Table Scrolling**: Resolved issue where tables in `CustomerManagement`, `OfficerManagement`, and `RecordingManagement` were not scrollable when displaying 25+ rows.
- **Sidebar Navigation**: Fixed the "Laporan" menu logic in `App.jsx` to only toggle expansion, preventing empty pages when clicking parent items.

## [0.0.6] - 2026-02-12

### Changed
- **Date Formatting Standardization**:
    - **Recording Management**: Standardized "TGL PENCATATAN" column and all export formats (CSV, Excel, PDF) to `dd/MM/yyyy`.
    - **Meter Analysis**: Updated "TGL VERIFIKASI" to use `dd/MM/yyyy` format.
    - **Officer Management**: Confirmed "TGL MASUK" and "TGL KELUAR" are consistently using `dd/MM/yyyy`.

## [0.0.5] - 2026-02-11

### Chores
- **Database Verification**:
    - Verified `rute` table structure and data integrity in `sicater_db.sql`.

## [0.0.4] - 2026-02-10

### Added
- **Global Table Sorting**:
    - Implemented click-to-sort functionality for all table headers across the application.
    - Supported components: `CustomerManagement`, `OfficerManagement`, `BranchManagement`, `RecordingManagement`, `MeterAnalysis`, and `OfficerMapping`.
    - Features: Ascending/Descending toggle, visual sort indicators, and compatibility with existing filters.
- **Advanced Toolbar (Officer Mapping)**:
    - Added "Pilih Kolom" dropdown to toggle column visibility.
    - Added "Filter" dropdown for specific search categories (Name, Connection No, Address, Route).
- **Soft Delete System**:
    - Implemented soft delete for Officers and Customers to preserve historical data integrity.
    - Updated `api/officers.php` and `api/customers.php` to handle `is_deleted` flag.

### Changed
- **UI/UX Refinements**:
    - **Customer Management**: Removed 'No. Urut' column and formatted active dates to `dd/mm/yyyy`.
    - **Officer Management**: displayed Branch Name instead of Code, and formatted all date fields to `dd/mm/yyyy`.
    - **Form Layout**: Optimized column spans for identity and location fields in forms for better readability.

## [0.0.3] - 2026-02-02

### Added
- **Negative Meter Usage Support**:
    - System now correctly processes and displays negative water usage (e.g., meter rollover or reset).
    - Added "(Meter Mundur)" indicator in recording forms and analysis views.
    - Updated `RecordingManagement.jsx` and `MeterAnalysis.jsx` to allow negative values in calculation and display without clamping to 0.

### Changed
- **Default Column Visibility**:
    - Removed 'KOORDINAT' from the default visible columns in `CustomerManagement` and `MeterAnalysis`.

## [0.0.2] - 2026-02-01

- **Enhanced Search Filtering**:
    - **Meter Analysis**: Added search category selection (By Nama, No. Sambungan, ID Meter, ID Tag).
    - Added clear (X) button to search inputs for better UX.

### Changed
- **Unified Flat Design**:
    - Removed vertical shadows and borders from all sticky columns (NO, ID, AKSI) for a cleaner, modern look.
    - Harmonized table text colors: using `#334155` for primary names and default light text for IDs.
- **Filter Layout Synchronization**:
    - Reordered controls in Meter Analysis to match the unified standard: `Pilih Kolom` → `Filter` → `Date Selector` → `Search`.
    - Restricted search input width to `350px` to maintain visual consistency with other modules.
- **Sticky Column Improvements**:
    - Applied sticky behavior to the "NO" column in Officer Management.
    - Simplified sequence calculation logic for better performance.

### Fixed
- Incorrect `colSpan` in empty table states after adding the sequence column.
- Vertical alignment and padding inconsistencies in table headers and cells.

### Added
- **History Pencatatan**: Introduced a dedicated history tab for viewing and managing past meter recordings.
- **Improved Filtering**:
    - Integrated `MonthYearPicker` for intuitive filtering by month and year in the History view.
    - Automated water consumption (m³) calculation based on comparison with previous month's data.
- **Sidebar Enhancements**: Added "History Pencatatan" to the main navigation with a dedicated history icon.
- **Common Components**: New `MonthYearPicker.jsx` for reused time-based selection across the app.

### Changed
- **Navigation UI**: Updated `App.jsx` sidebar to include the History entry.
- **Component Refactoring**: `RecordingManagement.jsx` now supports both current recordings and history views via a polymorphic `isHistory` prop.
- **Aesthetic Updates**: Updated sidebar icons for "Data Petugas" (User) and "Data Cabang" (Building2) for better visual clarity.

### Fixed
- UI layout and responsiveness issues in the recording data table.

## [0.0.1] - 2026-01-31

### Added
- **Status Laporan Field**: Added "Status Laporan" column to the "Tambah Catatan Meter" form.
    - Status options are fetched from the `status_kondisi` database table.
    - Integrated into the form for data entry and display.
    - Backend API (`recordings.php`) now supports the new `status_kondisi_id` field for both insertion and updates.
    - Frontend form correctly handles the selection and persistence of status.
- **Multi-Criteria Officer Mapping**: API `officers.php` now supports filtering by `route_code`, `branch_code`, and `kecamatan_code`.
- **Bidirectional Form Filtering**: In "Tambah Catatan Meter", selecting a customer filters assigned officers, AND selecting an officer filters the available customer list.
- **Improved Edit Mode Security**: 
    - The "Petugas" field in the edit form is now locked (disabled) to prevent changing the original recording officer.
    - Automatic officer mapping initialization when opening the edit modal.
    - Logic to ensure the original recording officer is displayed correctly even if there's a mapping mismatch.

### Changed
- Refactored `RecordingManagement.jsx` to handle form-level officer mapping instead of a global selector.
- Updated `customers.php` and `recordings.php` APIs to support server-side filtering by `officer_id`.

### Fixed
- Issue where the officer field remained empty in edit mode if the officer didn't match the current route assignment.
- Syntax error in `App.jsx` and `officers.php` during refactoring.
