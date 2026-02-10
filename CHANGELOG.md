# Changelog

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
