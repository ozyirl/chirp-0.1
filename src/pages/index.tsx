/* eslint-disable */
import Head from "next/head";
import Image from "next/image";
import Link from "next/link"

import { useUser } from "@clerk/nextjs";

import { SignInButton } from "@clerk/nextjs";

import { api, RouterOutputs } from "~/utils/api";

import dayjs from "dayjs";
import { PostView } from "~/components/postview";
import relativeTime from "dayjs/plugin/relativeTime";
//import { LoadingPage } from "src/components/loading";
import { LoadingPage, LoadingSpinner } from "~/components/loading";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { PageLayout } from "src/components/layout";


dayjs.extend(relativeTime);

const CreatePostWizard = ()=>{

  const {user} = useUser();

  const [input,setInput] = useState<string>();
  
  const ctx = api.useContext();

  const {mutate,isLoading: isPosting} = api.posts.create.useMutation({
    onSuccess:()=>{
      setInput("");
      void ctx.posts.getAll.invalidate
    },

    onError:(e)=>{
      const errorMessage = e.data?.zodError?.fieldErrors.content;
      if (errorMessage&&errorMessage[0] ){
        toast.error(errorMessage[0]);
      }else{
          toast.error("only emojis can be posted ")
      }
      
    }
  });

  

  if (!user) return null;


  return <div className="flex gap-3 w-full ">
    <Image src={user.imageUrl} alt="profile image" className="w-14 h-14 rounded-full"
    width={56}
    height={56}
    
    />
    <input  placeholder="whats happening?!"  className=" grow bg-transparent outline-none "
    type="text"
    value={input}
    onChange={(e) => setInput(e.target.value)}

    onKeyDown={(e)=>{
      if(e.key === "enter"){
        e.preventDefault();
        if(input!==""){
          mutate({ content: input?? ""});
        }
      }

    }}
    disabled={isPosting}
    />
   {input !=="" &&(
    <button onClick={() => mutate({ content: input ?? "" })} disabled={isPosting}>Post
    </button>)}

    {isPosting&&
    <div className="flex justify-center items-center  ">
    <LoadingSpinner size={20}/>
    </div>
    }
  </div>
}


const Feed = ()=>{
  const { data , isLoading: postsLoading} = api.posts.getAll.useQuery();

  if(postsLoading) return <LoadingPage/>

  if(!data) return <div>something went wrong </div>

  return(
    <div className="flex flex-col">
          {data.map((fullPost)=>(
            <PostView {...fullPost} key={fullPost.post.id}/>
          ))}
        </div>
  )
}

export default function Home() {
 
  const  { isLoaded: userLoaded, isSignedIn  } = useUser();
  api.posts.getAll.useQuery();

  if (!userLoaded ) return <div/>;



  


  return (
    
      
      <PageLayout>
        <div className="flex border-b border-slate-400 p-4">

        
          {!isSignedIn && ( 
          <div className="flex justify-center">

          
          <SignInButton/>
          </div>
          )}
          
          {isSignedIn && <CreatePostWizard/>}
          </div>
          

        
            <Feed/>
            </PageLayout>
       
    
  );
}
