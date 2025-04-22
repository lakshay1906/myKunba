"use client";

import React from "react";
import { useState } from "react";
import BlogCard from "./BlogCard";

export default function Blog() {
  const [data, setData] = useState([
    {
      id: 1,
      title: "The Rise of Remote Work: Pros and Cons",
      slug: "remote-work-pros-cons",
      author: "Amit Sharma",
      categories: ["Work", "Productivity", "Lifestyle"],
      summary:
        "Explore the benefits and challenges of remote work culture that's reshaping the global workforce.",
      coverImage:
        "https://plus.unsplash.com/premium_photo-1745048722723-c9752dd87662?w=700&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwyMXx8fGVufDB8fHx8fA%3D%3D",
      content:
        "Remote work has become a norm for many professionals. It offers flexibility, reduces commute time, and allows companies to hire talent globally...",
      createdAt: "2025-03-10T09:00:00Z",
      updatedAt: "2025-03-11T14:30:00Z",
    },
    {
      id: 2,
      title: "10 Tips for Better Time Management",
      slug: "time-management-tips",
      author: "Sneha Verma",
      categories: ["Self-Improvement", "Productivity"],
      summary:
        "Master your day with these practical time management tips that actually work.",
      coverImage:
        "https://plus.unsplash.com/premium_photo-1744370974892-2f3fdc78000c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHw1N3x8fGVufDB8fHx8fA%3D%3D",
      content:
        "Managing time efficiently is a skill every professional needs. Start by prioritizing tasks, using planners or digital tools like Notion...",
      createdAt: "2025-03-14T08:30:00Z",
      updatedAt: "2025-03-14T08:45:00Z",
    },
    {
      id: 3,
      title: "Beginner's Guide to Investing in India",
      slug: "investing-guide-india",
      author: "Lakshay Gupta",
      categories: ["Finance", "India", "Beginners"],
      summary:
        "Understand the basics of investing in Indian markets, including mutual funds, stocks, and SIPs.",
      coverImage:
        "https://plus.unsplash.com/premium_photo-1744370974892-2f3fdc78000c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHw1N3x8fGVufDB8fHx8fA%3D%3D",
      content:
        "If you're just starting out with investments, the Indian market offers various options including SIPs, mutual funds, and direct equity...",
      createdAt: "2025-03-19T12:15:00Z",
      updatedAt: "2025-03-20T09:00:00Z",
    },
    {
      id: 4,
      title: "How to Start a Successful Blog in 2025",
      slug: "start-successful-blog-2025",
      author: "Ritika Das",
      categories: ["Blogging", "Career", "Content Creation"],
      summary:
        "Want to start a blog this year? Here’s everything you need to know from choosing a niche to monetizing it.",
      coverImage:
        "https://plus.unsplash.com/premium_photo-1744370974892-2f3fdc78000c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHw1N3x8fGVufDB8fHx8fA%3D%3D",
      content:
        "Blogging is still very much alive in 2025. If you pick the right niche, consistently post good content, and use social media for promotion...",
      createdAt: "2025-03-23T17:20:00Z",
      updatedAt: "2025-03-23T18:00:00Z",
    },
    {
      id: 5,
      title: "The Impact of AI on Everyday Life",
      slug: "impact-of-ai",
      author: "Dr. Rohit Mehta",
      categories: ["Technology", "AI", "Future"],
      summary:
        "Artificial Intelligence is everywhere. Learn how it's influencing our homes, jobs, and the way we interact with the world.",
      coverImage:
        "https://plus.unsplash.com/premium_photo-1744370974892-2f3fdc78000c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHw1N3x8fGVufDB8fHx8fA%3D%3D",
      content:
        "From personalized shopping recommendations to AI-generated content, artificial intelligence has embedded itself into daily life...",
      createdAt: "2025-04-01T10:00:00Z",
      updatedAt: "2025-04-02T10:00:00Z",
    },
    {
      id: 6,
      title: "Minimalism: The Key to a Clear Mind",
      slug: "minimalism-clear-mind",
      author: "Nisha Kapoor",
      categories: ["Lifestyle", "Mindfulness", "Minimalism"],
      summary: "Embrace minimalism to declutter your space and your thoughts.",
      coverImage:
        "https://plus.unsplash.com/premium_photo-1744370974892-2f3fdc78000c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHw1N3x8fGVufDB8fHx8fA%3D%3D",
      content:
        "Minimalism isn’t just about throwing things away. It's about intentional living — focusing on what truly matters...",
      createdAt: "2025-04-10T07:30:00Z",
      updatedAt: "2025-04-11T08:00:00Z",
    },
    {
      id: 7,
      title: "Top 5 Programming Languages to Learn in 2025",
      slug: "top-programming-languages-2025",
      author: "Varun Mishra",
      categories: ["Programming", "Tech Trends", "Careers"],
      summary:
        "Stay relevant in tech with these must-learn programming languages.",
      coverImage:
        "https://plus.unsplash.com/premium_photo-1744370974892-2f3fdc78000c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHw1N3x8fGVufDB8fHx8fA%3D%3D",
      content:
        "Tech evolves quickly. In 2025, the most in-demand languages are Python, JavaScript, TypeScript, Rust, and Go. Here's why...",
      createdAt: "2025-04-15T11:45:00Z",
      updatedAt: "2025-04-15T12:00:00Z",
    },
  ]);
  return (
    <div id="blog" className="w-full my-12 container mx-auto xs:px-5 px-3">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Blog</h1>
        <p className="text-sm text-muted-foreground">
          Discover stories, insights, and updates from our community.
        </p>
      </div>
      <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 items-start gap-3">
        {data.map((ele) => (
          <BlogCard key={ele.id} post={ele} />
        ))}
      </div>
    </div>
  );
}
