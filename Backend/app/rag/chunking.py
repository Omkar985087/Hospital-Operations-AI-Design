from langchain_text_splitters import RecursiveCharacterTextSplitter

def chunk_document(text:str):
    
    if not text or not text.strip():
        return []
    
    splitter=RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        separators=[
            "\n\n",
            "\n",
            ".",
            " ",
            ""
        ],
        length_function=len
    )
    
    chunk=splitter.split_text(text)
    
    return chunk
