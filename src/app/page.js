"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./page.module.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import HashLoader from "react-spinners/HashLoader";

const MAX_TOKENS = 300; // Set a limit for each chunk based on the model's max token limit
const MAX_RETRIES = 5; // Maximum number of retry attempts
const INITIAL_RETRY_DELAY = 2000; // Initial retry delay in milliseconds

const Home = () => {
  const [videoUrl, setVideoUrl] = useState("");
  const [videoDetails, setVideoDetails] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [chunkedSummaries, setChunkedSummaries] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const aiFacts = [
    "AI can write its own code.",
    "AI can beat humans at complex games like Go.",
    "AI can generate human-like text and images.",
    "AI is being used in autonomous vehicles.",
    "AI can predict and diagnose diseases.",
    "AI can translate languages in real-time, breaking down communication barriers.",
    "AI algorithms can analyze medical images to assist in diagnosing diseases.",
    "AI can identify patterns in large datasets that are beyond human capability.",
  ];

  useEffect(() => {
    if (isLoading) {
      const intervalId = setInterval(() => {
        setQuoteIndex((prevIndex) => (prevIndex + 1) % aiFacts.length);
      }, 2000);
      return () => clearInterval(intervalId);
    }
  }, [isLoading]);
  const getVideoId = (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get("v");
    } catch {
      return null;
    }
  };

  const fetchVideoDetails = async (videoId) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/videoDetails?videoId=${videoId}`);
      setVideoDetails(response.data);
      toast.success("Details fetched successfully!");
    } catch (err) {
      console.log(err);
      setError("Could not fetch video details. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTranscript = async (videoId) => {
    try {
      const response = await axios.get(`/api/transcript?videoId=${videoId}`);
      setTranscript(response.data.transcript);
      const transcriptChunks = chunkText(response.data.transcript, MAX_TOKENS);
    } catch (err) {
      console.log(err);
      setError("Could not fetch transcript. Please try again later.");
    }
  };

  const handleClick = () => {
    setVideoDetails(null);
    setTranscript("");
    setChunkedSummaries("");
    setError("");
    const videoId = getVideoId(videoUrl);
    if (videoId) {
      fetchVideoDetails(videoId);
      fetchTranscript(videoId);
    } else {
      setError("Invalid YouTube URL");
    }
  };

  const chunkText = (text, maxTokens) => {
    const words = text.split(" ");
    const chunks = [];
    let chunk = [];
    let tokens = 0;

    for (const word of words) {
      tokens += 1;
      if (tokens > maxTokens) {
        chunks.push(chunk.join(" "));
        chunk = [];
        tokens = 0;
      }
      chunk.push(word);
    }
    if (chunk.length > 0) {
      chunks.push(chunk.join(" "));
    }
    return chunks;
  };

  const handleClickSummary = async () => {
    setIsLoading(true);
    try {
      const transcriptChunks = chunkText(transcript, MAX_TOKENS);
      const chunkSummaries = await Promise.all(
        transcriptChunks.map((chunk) => queryWithRetry({ inputs: chunk }))
      );
      setChunkedSummaries(chunkSummaries);
      toast.success("Summary is ready!");
    } catch (err) {
      console.log(err);
      setError("Could not summarize transcript. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const queryWithRetry = async (
    data,
    retries = 0,
    delay = INITIAL_RETRY_DELAY
  ) => {
    try {
      const result = await query(data);
      return result;
    } catch (err) {
      if (retries < MAX_RETRIES && err.message.includes("503")) {
        console.log(`Retry attempt ${retries + 1} after ${delay}ms...`);
        await new Promise((res) => setTimeout(res, delay));
        return queryWithRetry(data, retries + 1, delay * 2);
      } else {
        throw err;
      }
    }
  };

  const query = async (data) => {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/facebook/bart-large-cnn",
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_HUGGING_FACE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify(data),
        truncate: true,
        max_length: 512,
        wait_for_model: true,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    return result;
  };

  const scrollToMainContent = () => {
    document
      .querySelector(`.${styles.mainContent}`)
      .scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className={styles.container}>
      <ToastContainer text={"Summary extracted"} />
      <div className={styles.sidebar}>
        <h1 className={styles.title}>Youtube Video Summarizer </h1>
        <input
          type="text"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="Enter YouTube video URL"
          className={styles.input}
        />
        <button onClick={handleClick} className={styles.button}>
          Fetch Details
        </button>
        <div
          style={{
            textAlign: "center",
            marginTop: "50%",
            fontFamily: "Georgia",
          }}
        >
          <h1>About This App</h1>
          <p>
            This app allows you to enter a YouTube video URL and fetches the
            video details, transcript, and a summarized version of the
            transcript. It provides concise summaries. Ideal for quickly
            understanding the content of videos.
          </p>
        </div>
      </div>
      <div className={styles.mainContent}>
        {isLoading ? (
          <div className={styles.loadingScreen}>
            <HashLoader color={"#ffffff"} />
            <p>{aiFacts[quoteIndex]}</p>
          </div>
        ) : (
          <>
            {videoDetails && (
              <div className={styles.detailsContainer}>
                <h2 className={styles.videoTitle}>
                  {videoDetails.snippet.title}
                </h2>
                <img
                  src={videoDetails.snippet.thumbnails.high.url}
                  alt="Thumbnail"
                  className={styles.thumbnail}
                />
                <p className={styles.stats}>
                  Views: {videoDetails.statistics.viewCount} | Likes:{" "}
                  {videoDetails.statistics.likeCount}
                </p>
              </div>
            )}
            {transcript && (
              <div className={styles.transcriptContainer}>
                <h2 className={styles.transcriptTitle}>Transcript:</h2>
                <p className={styles.transcript}>{transcript}</p>
                <button
                  onClick={() => {
                    handleClickSummary();
                    scrollToMainContent();
                  }}
                  className={styles.button}
                >
                  Summarize Transcript
                </button>
              </div>
            )}
            {chunkedSummaries.length > 0 && (
              <div className={styles.summaryContainer}>
                <h2 className={styles.summaryTitle}>Summary:</h2>
                <ul className={styles.summaryList}>
                  {chunkedSummaries.map((summary, index) => (
                    <li key={index} className={styles.summaryItem}>
                      {summary[0]?.summary_text}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {error && <p className={styles.error}>{error}</p>}
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
