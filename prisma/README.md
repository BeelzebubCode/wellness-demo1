<div align="center">

# 🗄️ Database Schema — Entity Relationship Diagram

Full ERD documentation for the **Wellness Booking** system.

**60+ models** · **PostgreSQL 16** · **Prisma ORM**

[← Back to main README](../README.md)

</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [ERD — Geography & University](#-geography--university)
- [ERD — Accounts & Authorization](#-accounts--authorization)
- [ERD — Students](#-students)
- [ERD — Consultants & Organizations](#-consultants--organizations)
- [ERD — Booking Core](#-booking-core)
- [ERD — Booking Lifecycle](#-booking-lifecycle)
- [ERD — Feedback & Evaluation](#-feedback--evaluation)
- [ERD — Points & Discipline](#-points--discipline)
- [ERD — Consultant Borrowing](#-consultant-borrowing)
- [ERD — AI Knowledge Base](#-ai-knowledge-base)
- [ERD — Academic Calendar](#-academic-calendar)
- [ERD — Reference / Category Tables](#-reference--category-tables)
- [Full System ERD](#-full-system-erd)
- [Enums](#-enums)

---

## 🔭 Overview

The database is organized into **11 domains** with the following model counts:

| Domain | Models | Description |
|---|---|---|
| Geography & University | 4 | Region, Province, University, UniversityConnection |
| Accounts & Auth | 3 | Account, AccountRoleCategory, AccountUniversityPermission |
| Students | 8 | Student, Profile, Academic, Address, BehaviorStatus, PointWallet, etc. |
| Consultants | 6 | Consultant, Profile, Language, Specialization, ShiftTeam, Organization |
| Booking Core | 5 | Booking, TimeSlot, DayPeriod, BookingAssignment, BookingSession |
| Booking Lifecycle | 5 | Attendance, Outcome, Cancellation, AgreementSignature, ExceptionRequest |
| Feedback | 4 | Feedback, FeedbackRating, FeedbackComment, EvaluationCriterion |
| Points & Discipline | 4 | PointRule, PointTransaction, PointWallet, DisciplineLog |
| Consultant Borrowing | 4 | BorrowRequest, BorrowAssignment, BorrowAvailability, BorrowPolicy |
| AI Knowledge Base | 5 | KbDocument, KbDocumentVersion, KbChunk, KbDocumentRole, AiFeedbackEvent |
| Academic Calendar | 3 | AcademicTerm, AcademicPeriod, Season |
| Reference Tables | 15+ | GenderCategory, BloodGroupCategory, ServiceModeCategory, etc. |

---

## 🌍 Geography & University

```mermaid
erDiagram
    Region ||--o{ Province : "has"
    Province ||--o{ University : "located in"
    Province ||--o{ StudentAddress : "address in"
    University ||--o{ UniversityConnection : "source"
    University ||--o{ UniversityConnection : "target"
    University }o--o| UniversityTypeCategory : "type"

    Region {
        int region_id
        string region_name_th
        string region_name_en
        string region_code
    }

    Province {
        int province_id
        string province_code
        string province_name_th
        string province_name_en
        int region_id
        boolean is_special_zone
    }

    University {
        int university_id
        string university_code
        string university_name_th
        string university_name_en
        int province_id
        int rector_account_id
        int university_type_id
        boolean university_is_active
        decimal university_latitude
        decimal university_longitude
    }

    UniversityConnection {
        int connection_id
        int source_university_id
        int target_university_id
        decimal distance_km
        int connection_rank
    }
```

---

## 🔐 Accounts & Authorization

```mermaid
erDiagram
    AccountRoleCategory ||--o{ Account : "role"
    Account }o--o| University : "home university"
    Account ||--o{ AccountUniversityPermission : "permissions"
    AccountUniversityPermission }o--|| University : "access to"

    AccountRoleCategory {
        int account_role_id
        string code
        string name_th
        string name_en
        int sort_order
        boolean is_active
    }

    Account {
        int account_id
        string account_username
        string account_password
        datetime account_created_at
        datetime account_last_login_at
        int account_home_university_id
        int account_role_id
    }

    AccountUniversityPermission {
        int account_university_permission_id
        int account_id
        int university_id
        string access_role
        int access_granted_by_account_id
        datetime access_granted_at
        datetime access_revoked_at
    }
```

---

## 🎓 Students

```mermaid
erDiagram
    Account ||--o| Student : "is"
    Student ||--o| StudentProfile : "profile"
    Student ||--o| StudentAcademic : "academic"
    Student ||--o{ StudentAddress : "addresses"
    Student ||--o| StudentBehaviorStatus : "behavior"
    Student ||--o| StudentPointWallet : "wallet"
    Student ||--o{ StudentPointTransaction : "point txns"
    StudentProfile ||--o{ StudentChronicCondition : "conditions"
    StudentAcademic }o--|| Faculty : "enrolled in"
    StudentAcademic }o--|| Department : "belongs to"
    StudentAcademic }o--o| Advisor : "advised by"
    Student }o--|| StudentStatus : "status"
    StudentProfile }o--o| GenderCategory : "gender"
    StudentProfile }o--o| BloodGroupCategory : "blood group"
    StudentProfile }o--o| Country : "country"
    StudentProfile }o--o| IncomeBracketCategory : "income"
    StudentProfile }o--o| ParentalStatusCategory : "parental status"

    Student {
        int student_id
        int account_id
        int student_status_id
        string student_code
        int university_id
    }

    StudentProfile {
        int student_id
        string student_prefix
        string student_first_name_th
        string student_last_name_th
        string student_first_name_en
        string student_last_name_en
        datetime student_birthday
        int gender_category_id
        int blood_group_id
        int country_id
        int income_bracket_id
        int parental_status_id
    }

    StudentAcademic {
        int student_id
        int faculty_id
        int department_id
        int advisor_id
        string student_program
        string student_degree
        int student_admit_academic_year
        int education_level_id
    }

    StudentAddress {
        int student_address_id
        int student_id
        int province_id
        string student_address_postal_code
        int address_type_id
    }

    StudentBehaviorStatus {
        int student_id
        int university_id
        int student_trust_late_cancel_count
        int student_trust_no_show_count
        datetime student_trust_locked_until
    }
```

---

## 👨‍⚕️ Consultants & Organizations

```mermaid
erDiagram
    Account ||--o| Consultant : "is"
    Organization ||--o{ Consultant : "employs"
    Consultant }o--o| ConsultantShiftTeam : "shift team"
    Consultant ||--o| ConsultantProfile : "profile"
    Consultant ||--o{ ConsultantLanguage : "languages"
    Consultant ||--o{ ConsultantSpecialization : "specializations"
    Consultant }o--|| University : "belongs to"
    ConsultantShiftTeam }o--|| University : "at"

    Consultant {
        int consultant_id
        int account_id
        int organization_id
        int university_id
        int shift_team_id
    }

    ConsultantProfile {
        int consultant_id
        string consultant_prefix
        string consultant_first_name
        string consultant_last_name
        string consultant_gender
        string consultant_phone_number
        string consultant_email
    }

    ConsultantLanguage {
        int consultant_language_id
        int consultant_id
        string consultant_language_code
        string consultant_language_fluency_level
    }

    ConsultantSpecialization {
        int consultant_specialization_id
        int consultant_id
        string consultant_specialization_topic
    }

    Organization {
        int organization_id
        string organization_name
        string organization_type
    }

    ConsultantShiftTeam {
        int shift_team_id
        int university_id
        string team_name
        int team_order
    }
```

---

## 📋 Booking Core

```mermaid
erDiagram
    Student ||--o{ Booking : "creates"
    Consultant ||--o{ Booking : "assigned to"
    TimeSlot ||--o{ Booking : "scheduled in"
    University ||--o{ Booking : "belongs to"
    ProblemCategory ||--o{ Booking : "category"
    ServiceModeCategory ||--o{ Booking : "service mode"
    OnlineChannelCategory ||--o{ Booking : "online via"
    Booking ||--o{ BookingAssignment : "assignments"
    Booking ||--o| BookingSession : "session info"
    University ||--o{ TimeSlot : "has"
    TimeSlot }o--o| DayPeriod : "period"
    BookingAssignment }o--|| Consultant : "consultant"

    Booking {
        int university_id
        int booking_id
        int student_id
        int consultant_id
        int time_slot_id
        int problem_category_id
        int service_mode_id
        enum booking_status
        string booking_detail_text
        datetime booking_created_at
    }

    TimeSlot {
        int time_slot_id
        datetime time_slot_start_datetime
        datetime time_slot_end_datetime
        int time_slot_max_capacity
        enum time_slot_status
        int university_id
        int day_period_id
    }

    BookingAssignment {
        int booking_assignment_id
        int booking_id
        int consultant_id
        int university_id
        int assigned_by_account_id
        boolean is_auto_assigned
        boolean is_active
        datetime assigned_at
    }

    BookingSession {
        int booking_session_id
        int university_id
        int booking_id
        string booking_session_join_url
        string booking_session_phone_number
        int service_mode_id
        int online_channel_category_id
    }

    ProblemCategory {
        int problem_category_id
        string problem_category_code
        string problem_category_name_th
        string problem_category_name_en
    }

    DayPeriod {
        int day_period_id
        int university_id
        string day_period_code
        string day_period_name_th
        time start_time
        time end_time
        boolean spans_midnight
    }
```

---

## 🔄 Booking Lifecycle

```mermaid
erDiagram
    Booking ||--o| BookingAttendance : "attendance"
    Booking ||--o| BookingOutcome : "outcome"
    Booking ||--o| BookingCancellation : "cancellation"
    Booking ||--o| BookingAgreementSignature : "consent"
    Booking ||--o| BookingExceptionRequest : "exception"
    BookingExceptionRequest ||--o{ BookingExceptionEvidence : "evidence"
    BookingOutcome }o--o| RiskLevelCategory : "risk level"
    BookingCancellation }o--|| CancellationReason : "reason"

    BookingAttendance {
        int university_id
        int booking_id
        enum booking_attendance_status
        datetime booking_attendance_checked_in_at
        int booking_attendance_late_minutes
        int booking_attendance_marked_by_id
    }

    BookingOutcome {
        int university_id
        int booking_id
        string booking_outcome_consultant_note
        string booking_outcome_next_step
        int risk_level_id
    }

    BookingCancellation {
        int university_id
        int booking_id
        int booking_cancellation_cancelled_by_id
        int cancellation_reason_id
        string booking_cancellation_note
    }

    BookingAgreementSignature {
        int booking_agreement_signature_id
        int university_id
        int booking_id
        int student_id
        enum signature_method
        json signature_payload
    }

    BookingExceptionRequest {
        int booking_exception_request_id
        int university_id
        int booking_id
        int student_id
        enum booking_exception_status
        string booking_exception_reason_detail
        int exception_reason_id
    }

    BookingExceptionEvidence {
        int booking_exception_evidence_id
        int booking_exception_request_id
        string booking_exception_evidence_url
        string booking_exception_evidence_type
    }

    RiskLevelCategory {
        int risk_level_id
        string code
        string name_th
        string name_en
        string color
    }

    CancellationReason {
        int cancellation_reason_id
        string cancellation_reason_code
        string cancellation_reason_name_th
    }
```

---

## ⭐ Feedback & Evaluation

```mermaid
erDiagram
    Booking ||--o| Feedback : "feedback"
    Feedback ||--o{ FeedbackRating : "ratings"
    Feedback ||--o| FeedbackComment : "comment"
    FeedbackRating }o--|| EvaluationCriterion : "criterion"
    Feedback }o--|| Student : "from"
    Feedback }o--|| Consultant : "for"

    Feedback {
        int feedback_id
        int booking_id
        int student_id
        int consultant_id
        boolean feedback_is_anonymous
        datetime feedback_created_at
        int university_id
    }

    FeedbackRating {
        int feedback_rating_id
        int feedback_id
        int evaluation_criterion_id
        int feedback_rating_score
    }

    FeedbackComment {
        int feedback_id
        string feedback_comment_text
        string feedback_comment_admin_reply
        int feedback_comment_replied_by_id
    }

    EvaluationCriterion {
        int evaluation_criterion_id
        string evaluation_criterion_topic_th
        string evaluation_criterion_topic_en
        decimal evaluation_criterion_weight
        int evaluation_criterion_display_order
    }
```

---

## 🏅 Points & Discipline

```mermaid
erDiagram
    Student ||--o| StudentPointWallet : "wallet"
    Student ||--o{ StudentPointTransaction : "transactions"
    StudentPointTransaction }o--o| PointRule : "rule"
    StudentPointTransaction }o--o| Booking : "related booking"
    Student ||--o{ DisciplineLog : "discipline"
    DisciplineLog }o--|| DisciplineActionType : "action type"

    StudentPointWallet {
        int university_id
        int student_id
        int student_point_balance
    }

    StudentPointTransaction {
        int student_point_transaction_id
        int student_id
        int point_rule_id
        int booking_id
        string student_point_txn_type
        int student_point_amount
        string student_point_note
    }

    PointRule {
        int point_rule_id
        string point_rule_code
        string point_rule_name_th
        int point_rule_points
        boolean point_rule_is_active
    }

    DisciplineLog {
        int discipline_log_id
        int university_id
        int student_id
        int booking_id
        string action_type_code
        int delta_points
        datetime lock_until
        string note
        int created_by_id
    }

    DisciplineActionType {
        int action_type_id
        string action_code
        string name_th
        string name_en
        string direction
    }
```

---

## 🔄 Consultant Borrowing

```mermaid
erDiagram
    University ||--o{ BorrowRequest : "requests from"
    Account ||--o{ BorrowRequest : "requested by"
    BorrowRequest ||--o{ BorrowAssignment : "assignments"
    BorrowAssignment }o--|| Consultant : "consultant"
    BorrowAssignment ||--o{ ConsultantBorrowAvailability : "availability"
    BorrowAssignment ||--o{ BookingAssignment : "booking assignments"
    ConsultantBorrowAvailability }o--|| University : "home univ"
    ConsultantBorrowAvailability }o--|| University : "target univ"
    University ||--o{ ConsultantBorrowPolicy : "policy"

    BorrowRequest {
        int borrow_request_id
        int from_university_id
        int requested_by_account_id
        string borrow_request_title
        string borrow_request_reason
        int borrow_needed_count
        enum borrow_request_status
        datetime borrow_needed_from
        datetime borrow_needed_to
    }

    BorrowAssignment {
        int borrow_assignment_id
        int borrow_request_id
        int consultant_id
        int consultant_university_id
        datetime borrow_assign_start_at
        datetime borrow_assign_end_at
        int borrow_assigned_by_account_id
    }

    ConsultantBorrowAvailability {
        int consultant_borrow_availability_id
        uuid borrow_plan_id
        int consultant_id
        int home_university_id
        int target_university_id
        int borrow_assignment_id
        date availability_start_date
        date availability_end_date
        enum status
    }

    ConsultantBorrowPolicy {
        int consultant_borrow_policy_id
        int university_id
        int borrow_policy_days
        boolean is_active
    }
```

---

## 🤖 AI Knowledge Base

```mermaid
erDiagram
    AiKbDocument ||--o{ AiKbDocumentVersion : "versions"
    AiKbDocument ||--o{ AiKbChunk : "chunks"
    AiKbDocument ||--o{ AiKbDocumentRole : "roles"
    AiKbDocumentVersion ||--o{ AiKbChunk : "chunks"
    AiKbDocument }o--o| University : "belongs to"
    AiKbDocument }o--o| AiKbDocumentVersion : "published version"
    AiFeedbackEvent }o--o| University : "from"
    AiFeedbackEvent }o--o| Account : "by"
    AiFeedbackEvent }o--o| AiKbDocument : "resolved doc"

    AiKbDocument {
        int ai_kb_document_id
        int university_id
        string ai_kb_document_key
        string ai_kb_document_title
        string ai_kb_document_category
        boolean ai_kb_document_is_active
        int ai_kb_published_version_id
    }

    AiKbDocumentVersion {
        int ai_kb_document_version_id
        int ai_kb_document_id
        int ai_kb_version_no
        string ai_kb_content_type
        enum ai_kb_version_status
        string ai_kb_source_md
        string ai_kb_normalized_text
        enum ai_kb_index_status
    }

    AiKbChunk {
        int ai_kb_chunk_id
        int ai_kb_document_id
        int ai_kb_document_version_id
        int ai_kb_chunk_index
        string ai_kb_chunk_content_text
        json ai_kb_chunk_embedding
        int ai_kb_chunk_token_count
    }

    AiKbDocumentRole {
        int ai_kb_document_id
        string ai_actor_role
    }

    AiFeedbackEvent {
        int ai_feedback_event_id
        int university_id
        int account_id
        string ai_feedback_type
        string ai_user_question_text
        enum ai_feedback_status
        int ai_resolved_document_id
    }
```

---

## 📅 Academic Calendar

```mermaid
erDiagram
    University ||--o{ AcademicTerm : "terms"
    AcademicTermType ||--o{ AcademicTerm : "type"
    AcademicTerm ||--o{ AcademicPeriod : "periods"
    AcademicPeriod }o--|| AcademicPeriodTypeCategory : "period type"
    AcademicTerm ||--o{ Booking : "bookings in term"
    Season ||--o{ Booking : "bookings in season"

    AcademicTerm {
        int academic_term_id
        int university_id
        int academic_term_type_id
        int academic_year
        date term_start_date
        date term_end_date
        boolean is_active
    }

    AcademicTermType {
        int academic_term_type_id
        string academic_term_type_code
        string academic_term_type_name_th
    }

    AcademicPeriod {
        int period_id
        int academic_term_id
        int university_id
        int academic_period_type_id
        string period_name_th
        date period_start_date
        date period_end_date
    }

    Season {
        int season_id
        string season_code
        string season_name_th
        int month_start
        int month_end
    }
```

---

## 📚 Reference / Category Tables

All category/reference tables follow a consistent schema pattern:

```
{category_name}_category (
    {name}_id          INT    PRIMARY KEY
    code               VARCHAR(30)  UNIQUE
    name_th            VARCHAR(100)
    name_en            VARCHAR(100)
    sort_order         INT    DEFAULT 0
    is_active          BOOLEAN DEFAULT true
)
```

| Table | Used By |
|---|---|
| `AccountRoleCategory` | `Account.account_role_id` |
| `StudentStatus` | `Student.student_status_id` |
| `GenderCategory` | `StudentProfile.gender_category_id` |
| `BloodGroupCategory` | `StudentProfile.blood_group_id` |
| `IncomeBracketCategory` | `StudentProfile.income_bracket_id` |
| `ParentalStatusCategory` | `StudentProfile.parental_status_id` |
| `EducationLevelCategory` | `StudentAcademic.education_level_id` |
| `AddressTypeCategory` | `StudentAddress.address_type_id` |
| `NationalityTypeCategory` | `Country.nationality_type_id` |
| `UniversityTypeCategory` | `University.university_type_id` |
| `ServiceModeCategory` | `Booking.service_mode_id`, `BookingSession.service_mode_id` |
| `OnlineChannelCategory` | `Booking.online_channel_category_id` |
| `ProblemCategory` | `Booking.problem_category_id` |
| `CancellationReason` | `BookingCancellation.cancellation_reason_id` |
| `ExceptionReason` | `BookingExceptionRequest.exception_reason_id` |
| `RiskLevelCategory` | `BookingOutcome.risk_level_id` |
| `EvaluationCriterion` | `FeedbackRating.evaluation_criterion_id` |
| `DisciplineActionType` | `DisciplineLog.action_type_code` |
| `AcademicTermType` | `AcademicTerm.academic_term_type_id` |
| `AcademicPeriodTypeCategory` | `AcademicPeriod.academic_period_type_id` |
| `SubjectGroupCategory` | `Faculty.subject_group_category_id` |
| `ChronicConditionCategory` | `StudentChronicCondition.condition_category_id` |
| `NotificationTemplate` | `Notification.notification_template_id` |

---

## 🌐 Full System ERD

> This diagram shows all major entities and their relationships across the entire system.

```mermaid
erDiagram
    %% ── Geography ──
    Region ||--o{ Province : ""
    Province ||--o{ University : ""

    %% ── University Hierarchy ──
    University ||--o{ Faculty : ""
    Faculty ||--o{ Department : ""
    Department ||--o{ Advisor : ""

    %% ── Accounts ──
    AccountRoleCategory ||--o{ Account : ""
    Account }o--o| University : "home"
    Account ||--o| Student : ""
    Account ||--o| Consultant : ""
    Account ||--o| Advisor : ""

    %% ── Students ──
    Student ||--o| StudentProfile : ""
    Student ||--o| StudentAcademic : ""
    Student ||--o{ StudentAddress : ""
    Student ||--o| StudentBehaviorStatus : ""
    Student ||--o| StudentPointWallet : ""

    %% ── Consultants ──
    Organization ||--o{ Consultant : ""
    Consultant }o--o| ConsultantShiftTeam : ""
    Consultant ||--o| ConsultantProfile : ""

    %% ── Bookings ──
    University ||--o{ TimeSlot : ""
    University ||--o{ Booking : ""
    Student ||--o{ Booking : ""
    Consultant ||--o{ Booking : ""
    TimeSlot ||--o{ Booking : ""
    ProblemCategory ||--o{ Booking : ""

    %% ── Booking Lifecycle ──
    Booking ||--o{ BookingAssignment : ""
    Booking ||--o| BookingSession : ""
    Booking ||--o| BookingAttendance : ""
    Booking ||--o| BookingOutcome : ""
    Booking ||--o| BookingCancellation : ""
    Booking ||--o| BookingAgreementSignature : ""
    Booking ||--o| BookingExceptionRequest : ""
    Booking ||--o| Feedback : ""

    %% ── Feedback ──
    Feedback ||--o{ FeedbackRating : ""
    Feedback ||--o| FeedbackComment : ""

    %% ── Points & Discipline ──
    Student ||--o{ StudentPointTransaction : ""
    Student ||--o{ DisciplineLog : ""
    PointRule ||--o{ StudentPointTransaction : ""

    %% ── Borrowing ──
    University ||--o{ BorrowRequest : ""
    BorrowRequest ||--o{ BorrowAssignment : ""
    BorrowAssignment ||--o{ ConsultantBorrowAvailability : ""
    Consultant ||--o{ BorrowAssignment : ""

    %% ── AI KB ──
    AiKbDocument ||--o{ AiKbDocumentVersion : ""
    AiKbDocument ||--o{ AiKbChunk : ""

    %% ── Academic ──
    University ||--o{ AcademicTerm : ""
    AcademicTerm ||--o{ AcademicPeriod : ""

    %% ── Notifications ──
    Account ||--o{ Notification : ""
    NotificationTemplate ||--o{ Notification : ""
```

---

## 🏷️ Enums

| Enum | Values |
|---|---|
| `BookingStatus` | `PENDING_ASSIGNMENT`, `ASSIGNED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED` |
| `TimeSlotStatus` | `OPEN`, `CLOSED`, `CANCELLED`, `FULL` |
| `AttendanceStatus` | `PENDING`, `CHECKED_IN`, `LATE`, `NO_SHOW`, `CANCELLED_BY_CONSULTANT` |
| `ExceptionStatus` | `DRAFT`, `PENDING_REVIEW`, `APPROVED`, `REJECTED` |
| `BorrowRequestStatus` | `DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED`, `ASSIGNED`, `COMPLETED`, `CANCELLED` |
| `BorrowAvailabilityStatus` | `ACTIVE`, `COMPLETED`, `CANCELLED` |
| `KbVersionStatus` | `DRAFT`, `PUBLISHED`, `ARCHIVED` |
| `KbIndexStatus` | `PENDING`, `READY`, `FAILED` |
| `AiFeedbackStatus` | `OPEN`, `RESOLVED`, `IGNORED` |
| `ConsentSignatureMethod` | `DRAW` |

---

<div align="center">

📌 **Schema source:** [`schema.prisma`](./schema.prisma) (1500+ lines)

[← Back to main README](../README.md)

</div>
