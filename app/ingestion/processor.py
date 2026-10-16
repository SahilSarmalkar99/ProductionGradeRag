import os
import sys
import uuid
import json

from qdrant_client import QdrantClient
from qdrant_client.http import models

from app.config import settings
from app.ingestion.reterival.embedd import embed_texts, get_dim
from app.ingestion.loaders.webpage import crawl_website
from app.ingestion.loaders.webpage import crawl_website
from app.ingestion.chunking.splitter import chunk_text


PROCESSED_DATA_DIR = "processed_data"


qdrant_client = QdrantClient(
    url=settings.QDRANT_URL,
    api_key=settings.QDRANT_API_KEY,
)


def save_processed_locally(
    data: dict,
    source_type: str,
    filename: str
) -> str:

    folder = os.path.join(
        PROCESSED_DATA_DIR,
        source_type
    )

    os.makedirs(
        folder,
        exist_ok=True
    )

    dest = os.path.join(
        folder,
        f"{filename}.json"
    )

    with open(
        dest,
        "w",
        encoding="utf-8"
    ) as f:
        json.dump(
            data,
            f,
            ensure_ascii=False,
            indent=2
        )

    print(f"Saved processed data: {dest}")

    return dest


def index_chunks(
    chunks: list[str],
    filename: str,
    source_type: str,
    source_url: str = None
):
    if not chunks:
        print("No chunks to index.")
        return

    print("Generating embeddings...")

    embeddings = embed_texts(chunks)

    print(f"Generated {len(embeddings)} embeddings")

    points = []

    for chunk, vector in zip(chunks, embeddings):
        payload = {
            "text": chunk,
            "source": filename,
            "source_type": source_type,
        }

        if source_url:
            payload["url"] = source_url

        points.append(
            models.PointStruct(
                id=str(uuid.uuid4()),
                vector=vector,
                payload=payload,
            )
        )

    print(f"Uploading {len(points)} vectors to Qdrant...")

    QDRANT_BATCH_SIZE = 25

    for i in range(0, len(points), QDRANT_BATCH_SIZE):
        batch = points[i:i + QDRANT_BATCH_SIZE]

        qdrant_client.upsert(
            collection_name=settings.QDRANT_COLLECTION,
            points=batch,
            wait=True,
        )

        print(
            f"Uploaded Qdrant batch "
            f"{i + 1}-{i + len(batch)} / {len(points)}"
        )

    print(f"Indexed {len(points)} points to Qdrant")
    
    
def process_file(
    file_path: str,
    filename: str,
    source_type: str
):

    try:

        print(f"\nProcessing: {filename}")

        ext = (
            filename
            .lower()
            .rsplit(".", 1)[-1]
        )

        if ext in ("html", "htm"):

            print("Parsing HTML...")

            full_text = crawl_website(
                file_path
            )

        else:

            print(
                f"Skipping unsupported file type: "
                f"{filename}"
            )

            return

        if not full_text or not full_text.strip():

            print(
                f"No text extracted from "
                f"{filename}"
            )

            return

        print("Chunking text...")

        chunks = chunk_text(
            full_text
        )

        if not chunks:

            print("No chunks generated.")

            return

        print(
            f"Created {len(chunks)} chunks"
        )

        processed_data = {
            "filename": filename,
            "source_type": source_type,
            "chunks": chunks,
        }

        save_processed_locally(
            processed_data,
            source_type,
            filename
        )

        index_chunks(
            chunks,
            filename,
            source_type
        )

        print(
            f"Finished processing: {filename}"
        )

    except Exception as e:

        print(
            f"Failed to process "
            f"{filename}: {e}"
        )


def process_website(
    url: str,
    max_pages: int = 100,
    source_type: str = "website"
):

    print("\nStarting website ingestion")

    print(f"Website: {url}")

    print(
        f"Maximum pages: {max_pages}"
    )

    try:

        pages = crawl_website(
            url,
            max_pages=max_pages,
        )

        print(
            f"Crawled {len(pages)} pages"
        )

        if not pages:

            print(
                "No pages were successfully crawled."
            )

            return

        for index, page in enumerate(
            pages,
            start=1
        ):

            page_url = page["url"]

            title = page.get(
                "title",
                ""
            )

            text = page.get(
                "text",
                ""
            )

            print(
                f"\nProcessing page "
                f"{index}/{len(pages)}"
            )

            print(
                f"Title: {title}"
            )

            print(
                f"URL: {page_url}"
            )

            if not text.strip():

                print(
                    "Page contains no text. "
                    "Skipping."
                )

                continue

            print("Chunking page...")

            chunks = chunk_text(
                text
            )

            if not chunks:

                print(
                    "No chunks generated."
                )

                continue

            print(
                f"Created {len(chunks)} chunks"
            )

            safe_filename = (
                f"page_{index}"
            )

            processed_data = {
                "filename": safe_filename,
                "source_type": source_type,
                "url": page_url,
                "title": title,
                "chunks": chunks,
            }

            save_processed_locally(
                processed_data,
                source_type,
                safe_filename
            )

            index_chunks(
                chunks,
                safe_filename,
                source_type,
                source_url=page_url
            )

            print(
                f"Finished page "
                f"{index}/{len(pages)}"
            )

        print(
            "\nWebsite ingestion completed"
        )

    except Exception as e:

        print(
            f"Website ingestion failed: {e}"
        )


def process_directory(
    dir_path: str,
    source_type: str
):

    print(
        f"\nScanning directory: "
        f"{dir_path}"
    )

    files = [
        f
        for f in os.listdir(dir_path)
        if os.path.isfile(
            os.path.join(
                dir_path,
                f
            )
        )
    ]

    print(
        f"Found {len(files)} files"
    )

    for filename in files:

        file_path = os.path.join(
            dir_path,
            filename
        )

        process_file(
            file_path,
            filename,
            source_type
        )


def create_collection():

    if qdrant_client.collection_exists(
        settings.QDRANT_COLLECTION
    ):

        print(
            f"Qdrant collection already exists: "
            f"{settings.QDRANT_COLLECTION}"
        )

        return

    print(
        "Creating Qdrant collection..."
    )

    dim = get_dim()

    qdrant_client.create_collection(
        collection_name=settings.QDRANT_COLLECTION,
        vectors_config=models.VectorParams(
            size=dim,
            distance=models.Distance.COSINE,
        ),
    )

    print(
        f"Created collection: "
        f"{settings.QDRANT_COLLECTION}"
    )

    print(
        f"Embedding dimension: {dim}"
    )


def wipe_collection():

    if qdrant_client.collection_exists(
        settings.QDRANT_COLLECTION
    ):

        print(
            f"Deleting collection: "
            f"{settings.QDRANT_COLLECTION}"
        )

        qdrant_client.delete_collection(
            settings.QDRANT_COLLECTION
        )

        print("Collection deleted.")


def run_universal_ingestion(
    base_dir: str,
    explicit_source_type: str = None,
    wipe: bool = False
):

    print(
        "\nStarting universal ingestion"
    )

    print(
        f"Input: {base_dir}"
    )

    if wipe:

        print("Wipe requested")

        wipe_collection()

    create_collection()

    if base_dir.startswith(
        ("http://", "https://")
    ):

        source_type = (
            explicit_source_type
            or "website"
        )

        process_website(
            base_dir,
            source_type=source_type
        )

        return

    if not os.path.exists(
        base_dir
    ):

        print(
            f"Error: path "
            f"'{base_dir}' does not exist."
        )

        return

    subdirs = [
        d
        for d in os.listdir(
            base_dir
        )
        if os.path.isdir(
            os.path.join(
                base_dir,
                d
            )
        )
    ]

    if not subdirs:

        if explicit_source_type:

            source_type = (
                explicit_source_type
            )

        else:

            base_name = (
                os.path.basename(
                    os.path.normpath(
                        base_dir
                    )
                )
                .lower()
            )

            if "true" in base_name:

                source_type = "true"

            elif "noisy" in base_name:

                source_type = "noisy"

            else:

                source_type = "general"

        process_directory(
            base_dir,
            source_type
        )

    else:

        print(
            f"Found {len(subdirs)} subdirectories"
        )

        for subdir in subdirs:

            subdir_lower = (
                subdir.lower()
            )

            if "true" in subdir_lower:

                source_type = "true"

            elif "noisy" in subdir_lower:

                source_type = "noisy"

            else:

                source_type = subdir

            print(
                f"\nProcessing source: "
                f"{source_type}"
            )

            process_directory(
                os.path.join(
                    base_dir,
                    subdir
                ),
                source_type
            )

    print(
        "\nUniversal ingestion completed"
    )


if __name__ == "__main__":

    wipe_requested = (
        "--wipe" in sys.argv
    )

    clean_args = [
        arg
        for arg in sys.argv
        if arg != "--wipe"
    ]

    if len(clean_args) < 2:

        print(
            "Usage:"
        )

        print(
            "python -m app.ingestion.processor "
            "<URL_OR_DIRECTORY> [SOURCE_TYPE] [--wipe]"
        )

        sys.exit(1)

    target = clean_args[1]

    explicit_type = (
        clean_args[2]
        if len(clean_args) > 2
        else None
    )

    run_universal_ingestion(
        target,
        explicit_source_type=explicit_type,
        wipe=wipe_requested
    )

    print(
        "\nIngestion job completed."
    )