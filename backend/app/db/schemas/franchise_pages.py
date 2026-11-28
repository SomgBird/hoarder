from .base import _Read, _Strict


class FranchisePageWrite(_Strict):
    introduction: str


class FranchisePageSummary(_Read):
    id: int
    title: str


class FranchiseMemberRead(_Read):
    id: int
    title: str
    item_type: str


class FranchisePageRead(FranchisePageSummary):
    introduction: str | None
    members: list[FranchiseMemberRead]
