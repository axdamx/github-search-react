import React, { useState, useEffect } from "react";
import mockUser from "./mockData.js/mockUser";
import mockRepos from "./mockData.js/mockRepos";
import mockFollowers from "./mockData.js/mockFollowers";
import axios from "axios";

const rootUrl = "https://api.github.com";

const GithubContext = React.createContext();

const GithubProvider = ({ children }) => {
  const [githubUser, setGithubUser] = useState([]);
  const [githubRepos, setGithubRepos] = useState([]);
  const [githubFollowers, setGithubFollowers] = useState([]);
  //request loading
  const [request, setRequest] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState({ show: false, msg: "" });
  //check rate

  const searchGithubUser = async (user) => {
    toggleError();
    setIsLoading(true);
    const response = await axios(`${rootUrl}/users/${user}`).catch((err) =>
      console.log(err)
    );
    console.log(response);
    if (response) {
      setGithubUser(response.data);
      const { login, followers_url } = response.data;
      // repos
      // axios(`${rootUrl}/users/${login}/repos?per_page=100`).then((response) =>
      //   setGithubRepos(response.data)
      // );
      // //followers
      // axios(`${followers_url}?per_page=100`).then((response) =>
      //   setGithubFollowers(response.data)
      // );
      await Promise.allSettled([
        axios(`${rootUrl}/users/${login}/repos?per_page=100`),
        axios(`${followers_url}?per_page=100`),
      ])
        .then((result) => {
          const [repos, followers] = result;
          const status = "fulfilled";
          if (repos.status === status) {
            setGithubRepos(repos.value.data);
          }
          if (followers.status === status) {
            setGithubFollowers(followers.value.data);
          }
          console.log(result);
        })
        .catch((err) => console.log(err));
    } else {
      toggleError(true, "There is no user with that username");
    }
    checkRequest();
    setIsLoading(false);
  };

  //error loading
  const toggleError = (show = false, msg = "") => {
    setError({ show, msg });
  };

  const checkRequest = () => {
    axios(`${rootUrl}/rate_limit`)
      .then(({ data }) => {
        const {
          rate: { remaining },
        } = data;
        setRequest(remaining);
        if (remaining === 0) {
          toggleError(true, "Sorry, you have exceeded hourly rate limit");
          //throw an error
        }
      })
      .catch((error) => console.log(error));
  };

  useEffect(checkRequest, []);

  return (
    <GithubContext.Provider
      value={{
        githubUser,
        githubRepos,
        githubFollowers,
        request,
        error,
        searchGithubUser,
        isLoading,
      }}
    >
      {children}
    </GithubContext.Provider>
  );
};

export { GithubContext, GithubProvider };
