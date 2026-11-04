"""Bound multipart requests before the parser can spool oversized uploads to disk."""

from starlette.responses import JSONResponse

from .studio import MAX_BYTES


class StudioUploadLimit:
    def __init__(self, app):
        self.app = app
        self.limit = MAX_BYTES + 64 * 1024  # PDF plus bounded multipart headers/fields.

    async def __call__(self, scope, receive, send):
        if (
            scope["type"] != "http"
            or scope["method"] != "POST"
            or scope["path"] != "/api/studio/documents"
        ):
            return await self.app(scope, receive, send)
        headers = dict(scope["headers"])
        try:
            length = int(headers.get(b"content-length", b"0"))
        except ValueError:
            return await JSONResponse(
                {"detail": "Invalid upload length."}, status_code=400
            )(scope, receive, send)
        if length < 0 or length > self.limit:
            return await self.too_large(scope, receive, send)
        body = bytearray()
        while True:
            message = await receive()
            if message["type"] == "http.disconnect":
                return
            body.extend(message.get("body", b""))
            if len(body) > self.limit:
                return await self.too_large(scope, receive, send)
            if not message.get("more_body", False):
                break
        delivered = False

        async def bounded_receive():
            nonlocal delivered
            if not delivered:
                delivered = True
                return {"type": "http.request", "body": bytes(body), "more_body": False}
            return await receive()

        await self.app(scope, bounded_receive, send)

    async def too_large(self, scope, receive, send):
        await JSONResponse(
            {"detail": "PDF must be no larger than 8 MB."}, status_code=413
        )(scope, receive, send)
