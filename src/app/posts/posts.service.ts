import {Post} from './post.model';
import {Subject} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {map} from 'rxjs/operators';
import {Router} from '@angular/router';
import {environment} from '../../environments/environment';

// import {Injectable} from '@angular/core';
// @Injectable({providedIn: 'root'}) //alternative way
const BACKEND_URL = environment.apiUrl + '/posts/';

export class PostsService {
  private posts: Post[] = [];
  private postsUpdated = new Subject<{posts: Post[], postCount: number}>();

  constructor(private http: HttpClient, private router: Router) {}

  getPosts(postsPerPage: number, currentPage: number) {
    const queryParams = `?pagesize=${postsPerPage}&page=${currentPage}`;
    this.http
      .get<{message: string, posts: any, maxPosts: number}>( BACKEND_URL + queryParams)
      .pipe(map((postData) => {
        return { posts: postData.posts.map(post => {
          return {
            title: post.title,
            content: post.content,
            id: post._id,
            imagePath: post.imagePath,
            creator: post.creator,
            labels: post.labels
          };
        }), maxPosts: postData.maxPosts};
      }))
      .subscribe(transformedPostData => {
        console.log(transformedPostData);
        this.posts = transformedPostData.posts;
        this.postsUpdated.next({posts: [...this.posts], postCount: transformedPostData.maxPosts});
      });
    // return [...this.posts]; // can be original: this.posts, or copy ...
  }

  getPost(id: string) {
    return this.http.get<{
      _id: string,
      title: string,
      content: string,
      imagePath: string,
      creator: string,
      labels: [{
        _id: string,
        name: string,
        confidence: number
      }]
    }>(
      BACKEND_URL + id);
    // {...this.posts.find(p => p.id === id)};
  }
  getPostUpdateListener() {
    return this.postsUpdated.asObservable();
  }

  addPost(title: string, content: string, image: File) {
    // const post: Post = {id: null, title, content};
    const postData = new FormData();
    postData.append('title', title);
    postData.append('content', content);
    postData.append('image', image, title);
    this.http
      .post<{message: string, post: Post}>( BACKEND_URL, postData)
      .subscribe((responseData) => {
        // const post: Post = {
        //   id: responseData.post.id,
        //   title,
        //   content,
        //   imagePath: responseData.post.imagePath,
        //   creator: null,
        //   labels: responseData.post.labels
        // };
        // console.log(responseData.message);
        // const id = responseData.postId;
        // post.id = id;
        // console.log(responseData.post);
        // this.posts.push(post); // in case of successful server side response
        // this.postsUpdated.next([...this.posts]); // emitter
        this.router.navigate(['/']);
      });
  }

  updatePost(id: string, title: string, content: string, image: File | string, labels) {
    // const post: Post = { id, title, content, imagePath: null};
    let postData: Post | FormData;
    if (typeof(image) === 'object') { // a file will be an object, a string will not!
      postData = new FormData();
      postData.append('id', id);
      postData.append('title', title);
      postData.append('content', content);
      postData.append('image', image, title);
      postData.append('labels', labels);
    } else {
      postData = {
        id,
        title,
        content,
        imagePath: image,
        creator: null,
        labels
      };
    }
    this.http
      .put( BACKEND_URL + id, postData)
      .subscribe(response => {
        // const updatedPosts = [...this.posts];
        // const oldPostIndex = updatedPosts.findIndex(p => p.id === id);
        // const post: Post = {
        //   id,
        //   title,
        //   content,
        //   imagePath: '' // to be revisited
        // };
        // updatedPosts[oldPostIndex] = post;
        // this.posts = updatedPosts;
        // this.postsUpdated.next([...this.posts]);
        this.router.navigate(['/']);
      });
  }
  deletePost(postId: string) {
    return this.http.delete( BACKEND_URL + postId);
      // .subscribe(() => {
        // console.log('Deleted!');
        // const updatedPosts = this.posts.filter(post => post.id !== postId);
        // this.posts = updatedPosts;
        // this.postsUpdated.next([...this.posts]);
      // });
  }
}
