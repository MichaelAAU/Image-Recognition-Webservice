export interface Post {
  id: string;
  title: string;
  content: string;
  imagePath: string;
  creator: string;
  labels: [{
      _id: string;
      name: string;
      confidence: number
  }];
}
