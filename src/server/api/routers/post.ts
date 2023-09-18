import { clerkClient } from "@clerk/nextjs";
import { User } from "@clerk/nextjs/dist/types/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, privateProcedure, publicProcedure } from "~/server/api/trpc";


const filterUserForClient = (user: User)=>{
    return{
        id: user.id,
        username: user.username,
        profileImageUrl: user.imageUrl,
    }
}

export const postsRouter = createTRPCRouter({
 
    
  getAll: publicProcedure.query(async({ ctx }) => {
    const posts = await  ctx.db.post.findMany({
        take: 100,
        orderBy: [{
            createdAt: "desc"
        }]
    });

    const users =  (await clerkClient.users.getUserList({
        userId: posts.map ((post) => post.authorID),
        limit: 100,
    })
    ).map(filterUserForClient);

    console.log(users);
    return posts.map((post) =>{
        const author = users.find((user)=> user.id===post.authorID)

        if(!author || !author.username) 
        throw new TRPCError ({
            code:"INTERNAL_SERVER_ERROR",
            message:"author for post not found"
        })
        
        return{
        post,
        author: {
            ...author,
            username: author.username,
        }

  }});
    
  }),

  create: privateProcedure.input(z.object({
    content: z.string().emoji().min(1).max(280),
  })).mutation(async({ctx,input})=>{
    const authorID = ctx.userId;

    const post = await ctx.db.post.create({
        data: {
            authorID,
            content: input.content,
        },
    });
    return post;
  })
});
