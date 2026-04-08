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
