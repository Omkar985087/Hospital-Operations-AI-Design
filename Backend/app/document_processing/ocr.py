from paddleocr import PaddleOCR

class documentocr:
    def __init__(self):
        self.ocr=PaddleOCR(
            use_textline_orientation=True,lang="en"
        )
        
        
    def extract_text_from_image(self,image_path:str)->str:
        results=self.ocr.predict(image_path)
        
        extracted_text=[]
        
        for result in results:
            data=result.json
            if callable(data):
                data=data()
                
            res=data.get("res",data)
            
            for item in res.get("rec_text",[]):
                if item.strip():
                    extracted_text.append(item)
                    
        
        return "\n".join(extracted_text)
    

if __name__ == "__main__":

    ocr = documentocr()

    text = ocr.extract_text_from_image(
        "storage/sample_report.png"
    )

    print("\nExtracted OCR Text:\n")
    print(text)
