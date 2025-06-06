# AudioScribe Implementation Plan

## Overview
This document outlines the comprehensive UX/UI improvements and feature enhancements discussed for AudioScribe. Each section includes the rationale, implementation details, and expected benefits.

---

## Phase 1: Core Navigation & Dashboard Improvements

### 1.1 Sidebar Menu Restructure
**Current State:** Navigation is limited and doesn't support frequent actions
**Proposed Change:** Global sidebar with enhanced navigation

**Implementation:**
```
Sidebar Menu:
├── 📊 Dashboard (recent activity focused)
├── 📤 Upload & Process (global access)
├── 🔍 Search & Filter (new!)
├── 📚 Library (all transcripts)
├── 📁 Projects (all projects)
├── 🗑️ Trash (new!)
├── 📦 Archive (new!)
└── ⚙️ Settings
```

**Benefits:**
- Quick Upload accessible from any page
- Central search/filter functionality
- Clear data management with Trash/Archive

### 1.2 Dashboard Redesign
**Current State:** Project-focused view that becomes less useful with many transcripts
**Proposed Change:** Activity-focused dashboard

**Implementation:**
- 5 Most Recent Transcripts (sorted by last accessed/created)
- 3 Most Active Projects (sorted by last used, not created)
- Keep all existing stats and information
- Remove processing queue (move to Upload modal)

**Rationale:** Users need quick access to recent work, both transcripts and projects

---

## Phase 2: Upload & Processing Enhancements

### 2.1 Global Upload & Process Modal
**Current Name:** Quick Upload
**Proposed Names:** "Upload & Process" / "Add Media" / "New Recording"

**Features:**
- File selection area
- Processing queue (moved from dashboard)
- Project assignment dropdown:
  - None (default)
  - Existing projects (sorted by most recent)
  - "+ New Project" option
- Processing settings (STT model, validation options)
- Upload button

**New Project Flow:**
- Selecting "+ New Project" opens existing new project modal
- Request name and description
- Return to upload modal with new project selected

### 2.2 Multi-Project Support
**Change:** Transcripts can belong to multiple projects

**Database Impact:**
- Many-to-many relationship between transcripts and projects
- Project badges on transcript cards
- "Also in:" section on transcript detail page

**Benefits:**
- Same interview can be in "Leadership Study" AND "Q4 Review"
- Supports cross-project analysis
- More flexible organization

### 2.3 Duplicate File Handling
**Implementation:**
- Warning dialog: "This file is already in [Project A, Project B]. Continue?"
- Allow duplicate uploads (different analysis runs may yield different insights)
- Let researchers manage duplicates based on their needs

---

## Phase 3: Search, Filter & Organization

### 3.1 Universal Search & Filter Page
**New Feature:** Dedicated search/filter interface

**Features:**
- Full-text search across all transcripts and projects
- Filter options:
  - Keywords/themes
  - Speakers
  - Date ranges
  - Sentiment
  - Duration
  - Project association
- Mixed results showing both projects and transcripts
- Bulk actions toolbar

**Actions from Results:**
- View item
- Add transcript(s) to project(s)
- Create new project from selected transcripts
- Bulk tagging
- Move to archive/trash

### 3.2 Smart Project Assignment
**Feature:** Reuse search/filter for "Add Existing" in projects

**Implementation:**
- When in a project, "Add Existing" opens search/filter interface
- Pre-filtered to exclude transcripts already in project
- "Add to Project" button instead of "View"
- Smart suggestions (configurable in settings)

**Smart Suggestions:**
- Optional setting: "Enable project suggestions for new transcripts"
- Shows: "Suggested projects: Project A (85% match)"
- Can be dismissed
- Prevents annoyance for separate studies

---

## Phase 4: Data Management & Archival

### 4.1 Enhanced Deletion Flow
**Current:** Simple delete
**Proposed:** Granular removal options

**Delete Modal Design:**
```
Transcript: "Customer Interview - Jan 2024"

This transcript is part of these projects:
☑ Project A: Customer Interviews
☑ Project B: Q4 Analysis  
☐ Project C: Product Research
☑ Project D: Executive Summary

What would you like to do?

[Remove from Selected Projects] [Remove from All Projects] 
[Move to Trash] [Cancel]
```

**Options:**
1. **Remove from Selected Projects** - Removes only from checked projects
2. **Remove from All Projects** - Keeps transcript but removes all associations
3. **Move to Trash** - Moves to trash (can be restored within 30 days)

**Pre-selection Logic:**
- From Library view → All projects pre-checked
- From Project view → Only current project pre-checked

### 4.2 Trash System
**Implementation:**
- 30-day retention period
- Combined list of projects and transcripts (no tabs needed)
- Actions:
  - Restore individual items
  - Empty trash (with confirmation)
  - Auto-cleanup after 30 days

**Restore Logic:**
- Restoring a project also restores related transcripts if in trash
- If transcript missing, restore project but notify user

### 4.3 Archive System
**Location:** Sidebar menu item
**Implementation:**
- Two tabs: "Archived Projects" | "Archived Transcripts"
- Move to archive for long-term storage
- Archived items don't appear in main lists
- Can restore from archive anytime

**Use Cases:**
- Completed research projects
- Old transcripts for reference
- Declutter active workspace

---

## Phase 5: Project Templates & Analysis Configuration

### 5.1 Project Templates
**Purpose:** Standardize analysis for common research scenarios

**Built-in Templates:**
```
Interview Analysis:
☑ Speaker Detection
☑ Q&A Extraction
☑ Sentiment Analysis
☐ Emotion Detection
☑ Theme Extraction

Focus Group:
☑ Speaker Detection
☑ Theme Extraction
☑ Consensus/Divergence Analysis
☐ Q&A Extraction
☑ Notable Quotes

Survey Responses:
☐ Speaker Detection
☑ Sentiment Analysis
☑ Theme Extraction
☑ Concept Frequency
```

### 5.2 Template Management
**Settings → Templates Tab:**
- View built-in templates (read-only, can clone)
- Create custom templates
- Edit/delete custom templates
- Import/export templates

**Template Configuration:**
- Name & description
- Analysis options (checkboxes)
- Processing settings (chunk size, validation, etc.)
- AI prompt customization

### 5.3 Project Creation with Templates
**Enhanced Project Creation:**
1. Name & Description
2. Template selection (None, Built-in, Custom)
3. Analysis options (pre-filled by template, editable)
4. Create button

**Project Settings:**
- View current analysis configuration
- Change template/settings for existing project
- Re-run analysis with new settings

---

## Phase 6: Bulk Operations & Project Management

### 6.1 Bulk Actions in Library
**Features:**
- Multi-select transcripts
- Bulk operations:
  - Add to project(s)
  - Remove from project(s)
  - Move to archive
  - Move to trash
  - Apply tags

### 6.2 Enhanced Project Management
**Project Overview Additions:**
- Transcript count: "Contains 23 transcripts"
- Find orphaned transcripts button
- Bulk remove transcripts
- Project health indicators

**Orphaned Transcript Finder:**
- Lists transcripts not in any project
- Quick actions to assign or archive
- Helps maintain organization

---

## Phase 7: Additional Improvements

### 7.1 Settings Enhancements
**Already Implemented:**
- One-task-at-a-time analysis (fixes speaker detection issues)
- Validation options
- Speaker tagging settings
- Duplicate removal settings

**To Add:**
- Template management tab
- Smart suggestion toggle
- Archive retention settings
- Trash auto-cleanup settings

### 7.2 Visual Improvements
**Already Implemented:**
- Speaker breakdown as visual bars (not text)
- Speaker anonymization toggle
- Visual speaker highlighting (currently disabled due to error)

**To Fix/Add:**
- Re-implement speaker highlighting safely
- Add speaker colors to transcript view
- Project color coding in lists

---

## Implementation Priority

### High Priority (Phase 1-2)
1. Sidebar menu restructure
2. Dashboard redesign
3. Global Upload & Process modal
4. Multi-project support

### Medium Priority (Phase 3-4)
5. Search & Filter page
6. Enhanced deletion flow
7. Trash system (30-day retention)
8. Archive system

### Lower Priority (Phase 5-7)
9. Project templates
10. Template management
11. Bulk operations
12. Orphaned transcript finder

---

## Technical Considerations

### Database Changes Needed:
1. Many-to-many table for project-transcript relationships
2. Trash table with deletion timestamps
3. Archive flags for projects and transcripts
4. Template storage table
5. Search index for full-text search

### UI Components to Create:
1. Global sidebar component
2. Upload & Process modal (enhanced)
3. Search & Filter page
4. Deletion confirmation modal with checkboxes
5. Trash management page
6. Archive management page
7. Template editor
8. Bulk action toolbar

### API/Service Updates:
1. Multi-project assignment endpoints
2. Search/filter service
3. Trash management (soft delete, restore, cleanup)
4. Template CRUD operations
5. Bulk operation handlers

---

## Success Metrics
- Reduced clicks to upload (accessible from any page)
- Faster access to recent work (dashboard)
- Better organization (multi-project, search)
- Data safety (trash, archive, granular deletion)
- Consistency (templates)
- Efficiency (bulk operations)

---

## Notes
- All features prioritize researcher control and flexibility
- Nothing is forced - all organizational features are optional
- Focus on preventing accidental data loss
- Support both simple and complex research workflows