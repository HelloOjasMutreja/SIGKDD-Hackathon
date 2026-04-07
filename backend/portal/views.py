import json
from datetime import datetime
from typing import Any

from django.forms.models import model_to_dict
from django.http import HttpRequest, JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .models import Checkin, OrganizerProfile, ParticipantProfile, Team, TeamMember, Track, User

MODEL_MAP = {
    "user": User,
    "participantProfile": ParticipantProfile,
    "organizerProfile": OrganizerProfile,
    "team": Team,
    "teamMember": TeamMember,
    "track": Track,
    "checkin": Checkin,
}

RELATION_MAP = {
    User: {
        "participant": "participant",
        "organizerProfile": "organizerProfile",
    },
    Team: {
        "leader": "leader",
        "track": "track",
        "members": "members",
    },
    TeamMember: {
        "team": "team",
        "user": "user",
    },
    OrganizerProfile: {
        "user": "user",
    },
    Checkin: {
        "team": "team",
        "actor": "checkedInBy",
    },
    Track: {
        "teams": "teams",
    },
}


def health(_: HttpRequest) -> JsonResponse:
    return JsonResponse({"status": "ok", "service": "django-backend"})


def _iso(value: Any) -> Any:
    if isinstance(value, datetime):
        return value.isoformat()
    return value


def _serialize(obj: Any, include: dict[str, Any] | None = None) -> dict[str, Any]:
    data = model_to_dict(obj)
    data["id"] = str(obj.id)

    for field in [
        "createdAt",
        "updatedAt",
        "requestedAt",
        "respondedAt",
        "submittedAt",
        "approvedAt",
        "checkedInAt",
    ]:
        if hasattr(obj, field):
            data[field] = _iso(getattr(obj, field))

    if not include:
        return data

    rel_map = RELATION_MAP.get(type(obj), {})
    for key, conf in include.items():
        if key == "_count" and isinstance(obj, Track):
            data["_count"] = {"teams": obj.teams.count()}
            continue

        rel_name = rel_map.get(key, key)
        rel_value = getattr(obj, rel_name, None)

        if rel_value is None:
            data[key] = None
            continue

        if hasattr(rel_value, "all"):
            qs = rel_value.all()
            if isinstance(conf, dict):
                where = conf.get("where")
                if where:
                    qs = _apply_where(qs, where)
                order_by = conf.get("orderBy")
                if isinstance(order_by, dict):
                    [(k, v)] = list(order_by.items())
                    qs = qs.order_by(f"-{k}" if str(v).lower() == "desc" else k)
                nested_include = conf.get("include")
            else:
                nested_include = None

            data[key] = [_serialize(item, nested_include) for item in qs]
        else:
            nested_include = conf.get("include") if isinstance(conf, dict) else None
            data[key] = _serialize(rel_value, nested_include)

    return data


def _resolve_unique(model: Any, where: dict[str, Any]) -> Any:
    if "id" in where:
        return model.objects.filter(id=where["id"]).first()
    if "email" in where:
        return model.objects.filter(email=where["email"]).first()
    if "code" in where:
        return model.objects.filter(code=where["code"]).first()
    if "qrToken" in where:
        return model.objects.filter(qrToken=where["qrToken"]).first()
    if "userId" in where:
        return model.objects.filter(user_id=where["userId"]).first()
    if "teamId_userId" in where:
        pair = where["teamId_userId"]
        return model.objects.filter(team_id=pair["teamId"], user_id=pair["userId"]).first()
    return None


def _apply_where(qs: Any, where: dict[str, Any]) -> Any:
    filters = {}
    for key, value in where.items():
        if key == "teamId_userId" and isinstance(value, dict):
            filters["team_id"] = value.get("teamId")
            filters["user_id"] = value.get("userId")
        elif key.endswith("Id"):
            filters[f"{key[:-2]}_id"] = value
        else:
            filters[key] = value
    return qs.filter(**filters)


def _create_with_relations(model: Any, data: dict[str, Any]) -> Any:
    nested_participant = None
    nested_organizer = None
    nested_members = None

    if model is User and "participant" in data:
        nested_participant = data.pop("participant").get("create")
    if model is User and "organizerProfile" in data:
        nested_organizer = data.pop("organizerProfile").get("create")
    if model is Team and "members" in data:
        nested_members = data.pop("members").get("create")

    normalized = _normalize_data(data)
    obj = model.objects.create(**normalized)

    if nested_participant:
        ParticipantProfile.objects.create(user=obj, **_normalize_data(nested_participant))
    if nested_organizer:
        OrganizerProfile.objects.create(user=obj, **_normalize_data(nested_organizer))
    if nested_members:
        TeamMember.objects.create(team=obj, **_normalize_data(nested_members))

    return obj


def _normalize_data(data: dict[str, Any]) -> dict[str, Any]:
    out = {}
    for key, value in data.items():
        if key.endswith("Id") and key not in {"id"}:
            out[f"{key[:-2]}_id"] = value
        else:
            out[key] = value
    return out


@csrf_exempt
def query(request: HttpRequest) -> JsonResponse:
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        payload = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    model_name = payload.get("model")
    action = payload.get("action")
    args = payload.get("args", {})

    model = MODEL_MAP.get(model_name)
    if not model:
        return JsonResponse({"error": f"Unknown model: {model_name}"}, status=400)

    try:
        if action == "count":
            qs = model.objects.all()
            where = args.get("where")
            if where:
                qs = _apply_where(qs, where)
            return JsonResponse({"data": qs.count()})

        if action == "findUnique":
            where = args.get("where", {})
            include = args.get("include")
            obj = _resolve_unique(model, where)
            return JsonResponse({"data": _serialize(obj, include) if obj else None})

        if action == "findFirst":
            qs = model.objects.all()
            where = args.get("where")
            include = args.get("include")
            if where:
                qs = _apply_where(qs, where)
            obj = qs.first()
            return JsonResponse({"data": _serialize(obj, include) if obj else None})

        if action == "findMany":
            qs = model.objects.all()
            where = args.get("where")
            include = args.get("include")
            if where:
                qs = _apply_where(qs, where)
            order_by = args.get("orderBy")
            if isinstance(order_by, dict):
                [(k, v)] = list(order_by.items())
                qs = qs.order_by(f"-{k}" if str(v).lower() == "desc" else k)
            take = args.get("take")
            if isinstance(take, int):
                qs = qs[:take]
            return JsonResponse({"data": [_serialize(item, include) for item in qs]})

        if action == "create":
            data = args.get("data", {})
            include = args.get("include")
            obj = _create_with_relations(model, data)
            if include:
                obj = model.objects.get(id=obj.id)
            return JsonResponse({"data": _serialize(obj, include)})

        if action == "update":
            where = args.get("where", {})
            data = args.get("data", {})
            include = args.get("include")
            obj = _resolve_unique(model, where)
            if not obj:
                return JsonResponse({"data": None})
            for k, v in _normalize_data(data).items():
                setattr(obj, k, v)
            obj.save()
            obj.refresh_from_db()
            return JsonResponse({"data": _serialize(obj, include)})

        if action == "upsert":
            where = args.get("where", {})
            create_data = args.get("create", {})
            update_data = args.get("update", {})
            include = args.get("include")

            obj = _resolve_unique(model, where)
            if obj:
                for k, v in _normalize_data(update_data).items():
                    setattr(obj, k, v)
                obj.save()
                obj.refresh_from_db()
                return JsonResponse({"data": _serialize(obj, include)})

            if model is TeamMember and "teamId_userId" in where:
                pair = where["teamId_userId"]
                create_data = {**create_data, "teamId": pair["teamId"], "userId": pair["userId"]}

            obj = _create_with_relations(model, create_data)
            obj.refresh_from_db()
            return JsonResponse({"data": _serialize(obj, include)})

        if action == "delete":
            where = args.get("where", {})
            obj = _resolve_unique(model, where)
            if not obj:
                return JsonResponse({"data": None})
            serialized = _serialize(obj)
            obj.delete()
            return JsonResponse({"data": serialized})

        return JsonResponse({"error": f"Unknown action: {action}"}, status=400)

    except Exception as error:  # noqa: BLE001
        return JsonResponse({"error": str(error)}, status=500)
