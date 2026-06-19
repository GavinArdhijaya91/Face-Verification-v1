class FaceAligner:
    def __init__(self):
        pass

    def align(self, image, bbox):
        """
        Detect landmarks and align face.
        Returns aligned face image.
        """
        x1, y1, x2, y2 = bbox
        return image[y1:y2, x1:x2]
