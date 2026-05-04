from enum import StrEnum


class EnvironmentType(StrEnum):
    CLASSROOM = "CLASSROOM"
    LABORATORY = "LABORATORY"
    AUDITORIUM = "AUDITORIUM"
    MEETING_ROOM = "MEETING_ROOM"
    STUDIO = "STUDIO"
    MULTIPURPOSE = "MULTIPURPOSE"


class EnvironmentCriticality(StrEnum):
    COMMON = "COMMON"
    CONTROLLED = "CONTROLLED"
    RESTRICTED = "RESTRICTED"


class ResourceType(StrEnum):
    EQUIPMENT = "EQUIPMENT"
    FURNITURE = "FURNITURE"
    SOFTWARE_LICENSE = "SOFTWARE_LICENSE"
    KEY = "KEY"
    SUPPLY = "SUPPLY"
    KIT = "KIT"


class ReservationPurpose(StrEnum):
    CLASS = "CLASS"
    MEETING = "MEETING"
    RESEARCH = "RESEARCH"
    EVENT = "EVENT"
    MAINTENANCE = "MAINTENANCE"
    TRAINING = "TRAINING"


class ReservationStatus(StrEnum):
    DRAFT = "DRAFT"
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    AWAITING_CHECKIN = "AWAITING_CHECKIN"
    IN_USE = "IN_USE"
    AWAITING_CHECKOUT = "AWAITING_CHECKOUT"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    NO_SHOW = "NO_SHOW"


class ReservationType(StrEnum):
    SIMPLE = "SIMPLE"
    RECURRING = "RECURRING"
    COMPOSITE = "COMPOSITE"


class ApprovalStatus(StrEnum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class CalendarBlockType(StrEnum):
    MAINTENANCE = "MAINTENANCE"
    HOLIDAY = "HOLIDAY"
    EVENT = "EVENT"
    ADMIN_BLOCK = "ADMIN_BLOCK"


class PenaltyType(StrEnum):
    WARNING = "WARNING"
    SUSPENSION = "SUSPENSION"
    BLOCK = "BLOCK"


class AuditAction(StrEnum):
    CREATE = "CREATE"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    STATUS_CHANGE = "STATUS_CHANGE"
    LOGIN = "LOGIN"
    LOGOUT = "LOGOUT"


class BufferType(StrEnum):
    PRE = "PRE"
    POST = "POST"


class SupportType(StrEnum):
    TECHNICAL = "TECHNICAL"
    CLEANING = "CLEANING"
    SECURITY = "SECURITY"


class UserRole(StrEnum):
    ADMIN = "ADMIN"
    MANAGER = "MANAGER"
    TECHNICIAN = "TECHNICIAN"
    REQUESTER = "REQUESTER"


class AttachmentType(StrEnum):
    STUDENT = "STUDENT"
    PROFESSOR = "PROFESSOR"
    STAFF = "STAFF"
    EXTERNAL = "EXTERNAL"


class ResourceAttachment(StrEnum):
    FIXED = "FIXED"
    MOBILE = "MOBILE"
