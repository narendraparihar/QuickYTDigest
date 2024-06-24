import React, { useState } from "react";
import axios from "axios";
import styles from "./index.module.css";

const Home = () => {
  const [videoUrl, setVideoUrl] = useState("");
  const [videoDetails, setVideoDetails] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");

  const getVideoId = (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get("v");
    } catch {
      return null;
    }
  };

  const fetchVideoDetails = async (videoId) => {
    try {
      const response = await axios.get(`/api/videoDetails?videoId=${videoId}`);
      console.log(response.data);
      setVideoDetails(response.data);
    } catch (err) {
      setError("Could not fetch video details. Please try again later.");
    }
  };

  const fetchTranscript = async (videoId) => {
    try {
      const response = await axios.get(`/api/transcript?videoId=${videoId}`);
      setTranscript(response.data.transcript);
    } catch (err) {
      setError("Could not fetch transcript. Please try again later.");
    }
  };

  const handleClick = () => {
    setVideoDetails(null);
    setTranscript("");
    setError("");
    const videoId = getVideoId(videoUrl);
    if (videoId) {
      fetchVideoDetails(videoId);
      fetchTranscript(videoId);
    } else {
      setError("Invalid YouTube URL");
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        YouTube Video Fetcher {process.env.YOUTUBE_API_KEY} hey
      </h1>
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
      {error && <p className={styles.error}>{error}</p>}
      {videoDetails && (
        <div className={styles.detailsContainer}>
          <h2 className={styles.videoTitle}>{videoDetails.snippet.title}</h2>
          <img
            src={videoDetails.snippet.thumbnails.high.url}
            alt="Thumbnail"
            className={styles.thumbnail}
          />
          <p className={styles.description}>
            {videoDetails.snippet.description}
          </p>
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
        </div>
      )}
    </div>
  );
};

export default Home;
