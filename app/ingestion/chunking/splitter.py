from langchain_text_splitters import RecursiveCharacterTextSplitter


def chunk_text(text: str) -> list[str]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=200,
        chunk_overlap=100
    )

    chunks = splitter.split_text(text)

    print(f"Created {len(chunks)} chunks")

    return chunks