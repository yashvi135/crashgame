import React, { useState, useRef, useEffect } from "react";
import lottie from "lottie-web";
import Axios from "axios";
import io from "socket.io-client";
import { v4 as uuidv4 } from "uuid";
import papi from "./images/lit.png";
import Modal from "./components/modal/Modal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Slide } from "react-toastify";

import rocket from "./static/rocket.json";
import Badge from "react-bootstrap/Badge";
import RocketImage from "./images/rocket.png";
import SomeChart from "./components/SomeChart"
import "./css/App.css";
import "chart.js/auto";
import { Chart, Line } from "react-chartjs-2";
import moment from "moment";
import "chartjs-adapter-moment";
function App() {
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [betAmount, setBetAmount] = useState(
    localStorage.getItem("local_storage_wager") || 100
  );
  const [autoPayoutMultiplier, setAutoPayoutMultiplier] = useState(
    localStorage.getItem("local_storage_multiplier") || 2
  );
  const [userData, setUserData] = useState(null);
  const [multiplier, setMultiplier] = useState(null);
  const [liveMultiplier, setLiveMultiplier] = useState("CONNECTING...");
  const [liveMultiplierSwitch, setLiveMultiplierSwitch] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [globalSocket, setGlobalSocket] = useState(null);
  const [betActive, setBetActive] = useState(false);
  const [crashHistory, setCrashHistory] = useState([]);
  const [roundIdList, setRoundIdList] = useState([]);
  const [bBettingPhase, setbBettingPhase] = useState(false);
  const [bettingPhaseTime, setBettingPhaseTime] = useState(-1);
  const [bBetForNextRound, setbBetForNextRound] = useState(false);
  const [hookToNextRoundBet, setHookToNextRoundBet] = useState(false);
  const [messageToTextBox, setMessageToTextBox] = useState("");
  const [chatHistory, setChatHistory] = useState();
  const [liveBettingTable, setLiveBettingTable] = useState();
  const [errorMessage, setErrorMessage] = useState("");
  const [authResponseMessage, setAuthResponseMessage] = useState("");
  const [globalTimeNow, setGlobalTimeNow] = useState(0);
  const [openModalLogin, setOpenModalLogin] = useState(false);
  const [openModalRegister, setOpenModalRegister] = useState(false);
  const [chartData, setChartData] = useState({ datasets: [] });
  const [chartOptions, setChartOptions] = useState({});
  const [chartSwitch, setChartSwitch] = useState(false);
  const [gamePhaseTimeElapsed, setGamePhaseTimeElapsed] = useState();
  const [startTime, setStartTime] = useState();
  const [streakList, setStreakList] = useState([]);
  const [tenNumbers, setTenNumbers] = useState([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

  const multiplierCount = useRef([]);
  const timeCount_xaxis = useRef([]);
  const realCounter_yaxis = useRef(5);

  const chartRef = useRef("");

  const pointImage = new Image(100, 100); //Rocket Image width and Height on graph
  // pointImage.style.zIndex = 1;
  // console.log(pointImage.style);
  pointImage.src = RocketImage; // Setting Image src to rocket image
  // // console.log(pointImage.style);

  // Socket.io setup
  useEffect(() => {
    retrieve();
    // const socket = io.connect("http://localhost:3001");
    const socket = io.connect("https://api.game.shop2cash.in");
    setGlobalSocket(socket);

    socket.on("news_by_server", function (data) {
      setAnnouncement(data);
    });

    socket.on("start_multiplier_count", function (data) {
      setGlobalTimeNow(Date.now());
      setLiveMultiplierSwitch(true);
    });

    socket.on("stop_multiplier_count", function (data) {
      setLiveMultiplier(data);
      setLiveMultiplierSwitch(false);

      setBetActive(false);
    });

    socket.on("update_user", function (data) {
      getUser();
    });

    socket.on("crash_history", function (data) {
      setCrashHistory(data);

      let temp_streak_list = [];
      const new_data = data;
      let blue_counter = 0;
      let red_counter = 0;
      console.log(new_data);

      for (let i = 0; i < data.length; i++) {
        if (new_data[i] >= 2) {
          blue_counter += 1;
          red_counter = 0;
          temp_streak_list.push(blue_counter);
        } else {
          red_counter += 1;
          blue_counter = 0;
          temp_streak_list.push(red_counter);
        }
      }
      setStreakList(temp_streak_list.reverse());
    });

    socket.on("get_round_id_list", function (data) {
      setRoundIdList(data.reverse());
    });

    socket.on("start_betting_phase", function (data) {
      setGlobalTimeNow(Date.now());
      setLiveMultiplier("Starting...");
      setbBettingPhase(true);
      setLiveBettingTable(null);
      setHookToNextRoundBet(true);
      retrieve_active_bettors_list();

      multiplierCount.current = [];
      timeCount_xaxis.current = [];
    });

    socket.on("receive_live_betting_table", (data) => {
      setLiveBettingTable(data);
      data = JSON.parse(data);
      setTenNumbers(Array(10 - data.length).fill(2));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Define useEffects
  useEffect(() => {
    if (hookToNextRoundBet) {
      if (bBetForNextRound) {
        send_bet();
      } else {
      }
      setHookToNextRoundBet(false);
      setbBetForNextRound(false);
    }
  }, [hookToNextRoundBet]);

  useEffect(() => {
    if (betActive && autoPayoutMultiplier <= liveMultiplier) {
      userData.balance += betAmount * autoPayoutMultiplier;
      auto_cashout_early();
      setBetActive(false);
    }
  }, [liveMultiplier]);

  const buttonClick = () => {
    globalSocket.emit("clicked", { message2: Date.now() });
  };

  useEffect(
    () => {
      let gameCounter = null;
      if (liveMultiplierSwitch) {
        setLiveMultiplier("1.00");

        gameCounter = setInterval(() => {
          let time_elapsed = (Date.now() - globalTimeNow) / 1000.0;
          setGamePhaseTimeElapsed(time_elapsed);
          setLiveMultiplier(
            (1.0024 * Math.pow(1.0718, time_elapsed)).toFixed(2)
          );

          if (multiplierCount.current.length < 1) {
            multiplierCount.current = multiplierCount.current.concat([1]);
            timeCount_xaxis.current = timeCount_xaxis.current.concat([0]);
          }
          if (realCounter_yaxis.current % 5 == 0) {
            multiplierCount.current = multiplierCount.current.concat([
              (1.0024 * Math.pow(1.0718, time_elapsed)).toFixed(2),
            ]);
            timeCount_xaxis.current = timeCount_xaxis.current.concat([
              time_elapsed,
            ]);
          }

          realCounter_yaxis.current += 1;
        }, 1);
      }
      return () => {
        clearInterval(gameCounter);
      };
    },
    [liveMultiplierSwitch],

    [chartData]
  );

  useEffect(() => {
    let bettingInterval = null;

    if (bBettingPhase) {
      bettingInterval = setInterval(() => {
        let time_elapsed = (Date.now() - globalTimeNow) / 1000;
        let time_remaining = (10 - time_elapsed).toFixed(2);
        setBettingPhaseTime(time_remaining);
        if (time_remaining < 0) {
          setbBettingPhase(false);
        }
      }, 10);
    }
    return () => {
      clearInterval(bettingInterval);

      setBettingPhaseTime("Starting...");
    };
  }, [bBettingPhase]);

  useEffect(() => {
    if (bBetForNextRound) {
    } else {
    }
  }, [bBetForNextRound]);

  useEffect(() => {
    localStorage.setItem("local_storage_wager", betAmount);
    localStorage.setItem("local_storage_multiplier", autoPayoutMultiplier);
  }, [betAmount, autoPayoutMultiplier]);

  useEffect(() => {
    get_game_status();
    getUser();
    setChartSwitch(true);
    setStartTime(Date.now());
    let getActiveBettorsTimer = setTimeout(
      () => retrieve_active_bettors_list(),
      1000
    );
    let getBetHistory = setTimeout(() => retrieve_bet_history(), 1000);

    return () => {
      clearTimeout(getActiveBettorsTimer);
      clearTimeout(getBetHistory);
    };
  }, []);

  useEffect(() => {}, [liveBettingTable]);

  // Routes
  // const API_BASE = "http://localhost:3001";
  const API_BASE = "https://api.game.shop2cash.in";
  const register = () => {
    Axios({
      method: "POST",
      data: {
        username: registerUsername,
        password: registerPassword,
      },
      withCredentials: true,
      url: API_BASE + "/register",
    }).then((res) => {
      setAuthResponseMessage(res.data);

      if (res.data == "Username already exists") {
        return;
      }
      Axios({
        method: "POST",
        data: {
          username: registerUsername,
          password: registerPassword,
        },
        withCredentials: true,
        url: API_BASE + "/login",
      }).then((res) => {
        setAuthResponseMessage(res.data);
        getUser();

        if (res.data === "Login Successful") {
          setOpenModalRegister(false);
          registerAndLoginToast();
        }
      });
    });
  };

  const login = () => {
    Axios({
      method: "POST",
      data: {
        username: loginUsername,
        password: loginPassword,
      },
      withCredentials: true,
      url: API_BASE + "/login",
    }).then((res) => {
      setAuthResponseMessage(res.data);
      getUser();

      if (res.data === "Login Successful") {
        setOpenModalLogin(false);
        loginToast();
      }
    });
  };

  const getUser = () => {
    Axios({
      method: "GET",
      withCredentials: true,
      url: API_BASE + "/user",
    }).then((res) => {
      setUserData(res.data);
    });
  };
  const logout = () => {
    Axios.get(API_BASE + "/logout", {
      withCredentials: true,
    }).then((res) => {
      getUser();
      logoutToast();
    });
  };

  const multiply = () => {
    Axios.get(API_BASE + "/multiply", {
      withCredentials: true,
    }).then((res) => {
      if (res.data !== "No User Authentication") {
        setUserData(res.data);
      }
    });
  };

  const generate = () => {
    Axios.get(API_BASE + "/generate_crash_value", {
      withCredentials: true,
    }).then((res) => {
      setMultiplier(res.data);
    });
  };

  const retrieve = () => {
    Axios.get(API_BASE + "/retrieve", {
      withCredentials: true,
    }).then((res) => {
      setMultiplier(res.data);
    });
  };

  const send_bet = () => {
    Axios({
      method: "POST",
      data: {
        bet_amount: betAmount,
        payout_multiplier: autoPayoutMultiplier,
      },
      withCredentials: true,
      url: API_BASE + "/send_bet",
    })
      .then((res) => {
        setBetActive(true);
        userData.balance -= betAmount;
        setUserData(userData);
      })
      .catch((err) => {
        if (err.response) {
        }
      });
  };

  const calculate_winnings = () => {
    Axios.get(API_BASE + "/calculate_winnings", {
      withCredentials: true,
    }).then((res) => {
      getUser();
    });
  };

  const get_game_status = () => {
    Axios.get(API_BASE + "/get_game_status", {
      withCredentials: true,
    }).then((res) => {
      if (res.data.phase === "betting_phase") {
        setGlobalTimeNow(res.data.info);
        setbBettingPhase(true);
      } else if (res.data.phase === "game_phase") {
        setGlobalTimeNow(res.data.info);
        setLiveMultiplierSwitch(true);
      }
    });
  };

  const manual_cashout_early = () => {
    Axios.get(API_BASE + "/manual_cashout_early", {
      withCredentials: true,
    }).then((res) => {
      setUserData(res.data);
      setBetActive(false);
    });
  };

  const auto_cashout_early = () => {
    Axios.get(API_BASE + "/auto_cashout_early", {
      withCredentials: true,
    }).then((res) => {
      setUserData(res.data);
      setBetActive(false);
    });
  };

  const bet_next_round = () => {
    setbBetForNextRound(!bBetForNextRound); //
  };

  const retrieve_active_bettors_list = () => {
    Axios.get(API_BASE + "/retrieve_active_bettors_list", {
      withCredentials: true,
    }).then((res) => {});
  };

  const retrieve_bet_history = () => {
    Axios.get(API_BASE + "/retrieve_bet_history", {
      withCredentials: true,
    }).then((res) => {});
  };

  // Functions
  const handleKeyDownBetting = (e) => {
    if (e.key === "Enter") {
      if (bBettingPhase) {
        send_bet();
      } else {
        bet_next_round();
      }
    }
  };

  const verifyBetAmount = (text) => {
    const validated = text.match(/^(\d*\.{0,1}\d{0,2}$)/);
    const re = /^[0-9\b]+$/;

    if (text === "" || re.test(text)) {
      setBetAmount(text);
    }
    if (text > userData.balance) {
      setErrorMessage("Bet greater than balance");
    } else {
      setErrorMessage("");
    }
  };

  const verifyMultiplierAmount = (text) => {
    const validated = text.match(/^(\d*\.{0,1}\d{0,2}$)/);
    if (validated) {
      setAutoPayoutMultiplier(text);
    }
  };

  // Define Toasts
  const loginToast = () => {
    toast.success("Login Successful", {
      position: "top-center",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: true,
      progress: undefined,
      theme: "dark",
      transition: Slide,
    });
  };

  const registerAndLoginToast = () => {
    toast.info("Account Created and Logged In", {
      position: "top-center",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: true,
      progress: undefined,
      theme: "dark",
      transition: Slide,
    });
  };

  const logoutToast = () => {
    toast.success("You have been logged out", {
      position: "top-center",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: true,
      progress: undefined,
      theme: "dark",
      transition: Slide,
    });
  };

  const temp_time = Date.now();

  useEffect(() => {
    const temp_interval = setInterval(() => {
      setChartSwitch(false);
      sendToChart();
    }, 1);
    return () => {
      clearInterval(temp_interval);
      setChartSwitch(true);
    };
  }, [chartSwitch]);

  const sendToChart = () => {
    //Creating Image List for Points
    const counter = multiplierCount.current.length;
    var rocketImagePoints = []; //list of images for points
    var rocketPointRadius = []; //list of radius for points
    for (var i = 0; i < counter - 2; i++) {
      rocketPointRadius.push(0); //adding 0 as point radius
      rocketImagePoints.push(""); //adding empty image point
    }

    rocketPointRadius.push(50); //setting point radius to 50
    rocketImagePoints.push(pointImage); //setting image at second last point
    rocketPointRadius.push(0); //set point radius 0 for last point
    rocketImagePoints.push(""); // set image to none for last point

    setChartData({
      labels: timeCount_xaxis.current,
      datasets: [
        {
          data: multiplierCount.current,
          backgroundColor: "rgba(75,192,192,0.2)",
          borderColor: "rgba(75,192,192,1)",
          fill: true,
          lineTension: 0,
        },
      ],
    });
    setChartOptions({
      events: [],
      maintainAspectRatio: false,
      elements: {
        // line: {
        //   tension: 0.1,
        // },
        point: {
          radius: rocketPointRadius,
          pointStyle: rocketImagePoints,
        },
      },
      scales: {
        yAxes: {
          type: "linear",
          title: {
            display: false,
            text: "value",
          },
          min: 1,
          max: liveMultiplier > 2.5 ? liveMultiplier : 2.5,
          ticks: {
            color: "rgba(255, 255, 255,1)",
            maxTicksLimit: 5,
            callback: function (value, index, values) {
              if (value % 0.5 == 0) return parseFloat(value).toFixed(2);
            },
          },
          grid: {
            display: true,
            color: "white",
            borderColor: "white",
          },
        },
        xAxes: {
          type: "linear",
          title: {
            display: false,
            label: "none",
          },
          ticks: {
            display: false,
          },

          grid: {
            display: false,
            color: "white",
            // borderColor:"white",
            borderColor: "white",
          },
        },
      },
      plugins: {
        legend: { display: false },
      },
      animation: {
        x: {
          type: "number",
          easing: "linear",
          duration: 0,
          from: 5,
          delay: 0,
        },
        y: {
          type: "number",
          easing: "linear",
          duration: 0,
          from: 5,
          delay: 0,
        },
        loop: true,
      },
    });
  };
  //JSX
  return (
    <div className="container-fluid game-color">
      <div>
        <ToastContainer />
        <Modal trigger={openModalLogin} setTrigger={setOpenModalLogin}>
          <div className="login-modal">
            <div>
              {authResponseMessage ? (
                <p className="err-msg">{authResponseMessage}</p>
              ) : (
                ""
              )}
              <h1>Login</h1>
            </div>
            <div className="form-group">
              <label>Username: </label>
              <input
                placeholder="Enter your username"
                onChange={(e) => setLoginUsername(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Password:</label>
              <input
                placeholder="Enter your password"
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </div>
            <div>
              <button className="modal-submit" onClick={login}>
                Submit
              </button>
              <br />
            </div>
          </div>
        </Modal>
        <div>
          <Modal trigger={openModalRegister} setTrigger={setOpenModalRegister}>
            <div className="login-modal">
              <div>
                {authResponseMessage ? (
                  <p className="err-msg">{authResponseMessage}</p>
                ) : (
                  ""
                )}
                <h1>Register</h1>
              </div>
              <div className="form-group">
                <label>Username: </label>
                <input
                  placeholder="Enter your username"
                  onChange={(e) => setRegisterUsername(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Password:</label>
                <input
                  placeholder="Enter your password"
                  onChange={(e) => setRegisterPassword(e.target.value)}
                />
              </div>
              <div>
                <button className="modal-submit" onClick={register}>
                  Submit
                </button>
                <br />
              </div>
              {registerUsername !== "" && registerUsername.length < 3 ? (
                <span className="register_errors">
                  Username must have at least 3 characters
                </span>
              ) : (
                ""
              )}{" "}
              <br />
              {registerPassword !== "" && registerPassword.length < 3 ? (
                <span className="register_errors">
                  Password must have at least 3 characters
                </span>
              ) : (
                ""
              )}
            </div>
            <div></div>
          </Modal>
        </div>

        <nav className="navbar">
          <div className="container-fluid nav-fonts">
            <span className="logo">Crash Gambling Simulator</span>
            <ul className="nav">
              {userData && userData !== "No User Authentication" ? (
                <>
                  <li>User: {userData.username}</li>
                  <li>
                    <a href="#" onClick={logout}>
                      Logout
                    </a>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <a
                      href="#"
                      onClick={() => {
                        setOpenModalLogin(true);
                        setAuthResponseMessage("");
                      }}
                    >
                      Login
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      onClick={() => {
                        setOpenModalRegister(true);
                        setAuthResponseMessage("");
                      }}
                    >
                      Register
                    </a>
                  </li>
                </>
              )}
            </ul>
          </div>
        </nav>

        <div className="row">
          <div className="col-md-12 col-xl-9 col-lg-8 col-sm-12 mt-3 position-check">
            {
              <div className="grid-container-main">
                <div className="grid-elements ">
                  <div className="effects-box">
                    <div className=" display-b">
                      <div className="crash-btn">
                        <i className="fa fa-bar-chart" aria-hidden="true"></i>
                        {crashHistory
                          .slice(0)
                          .reverse()
                          .map((crash, index, array) => {
                            const badgeColors = [
                              "primary",
                              "secondary",
                              "success",
                              "danger",
                              "warning",
                              "info",
                              "light",
                              "dark",
                            ];
                            return (
                              <Badge
                                bg={crash > 2 ? "danger" : "success" || "info"}
                                style={{
                                  paddingRight: "8px",
                                  paddingLeft: "8px",
                                  paddingTop: "5px",
                                  paddingBottom: "5px",
                                  margin: "0px 0px 15px 15px",
                                  fontSize: "18px",
                                  height: "100%",
                                  width: "100%",
                                }}
                              >
                                x{crash}
                              </Badge>
                            );
                          })}
                      </div>
                    </div>
                    <div className="cash-graph-icon">
                      {/* <TimelineIcon/> */}
                    </div>
                    <div
                      id="chartContainer"
                      style={{
                        height: "100%",
                        width: "85%",
                        position: "absolute",
                        top: "10%",
                        zIndex: 1,
                        objectFit: "contain",
                        overflow: "visible",
                      }}
                    >
                      {chartData ? (
                        <div>
                          <div>
                            <SomeChart
                              ref={chartRef}
                              chartData={chartData}
                              chartOptions={chartOptions}
                            ></SomeChart>
                          </div>
                        </div>
                      ) : (
                        ""
                      )}
                    </div>

                    <div
                      style={{
                        position: "absolute",
                        zIndex: 1,
                        top: "40%",
                        color: "#fff",
                      }}
                    >
                      {(() => {
                        if (bBettingPhase) {
                          return (
                            <div className="bet-text">
                              <h1 className="white-color">Prepare Yourself</h1>
                              <h1 className="white-color">
                                in {bettingPhaseTime}
                              </h1>
                            </div>
                          );
                        } else {
                          return (
                            <h1
                              className={` ${
                                !liveMultiplierSwitch &&
                                liveMultiplier !== "Starting..." &&
                                liveMultiplier !== "CONNECTING..."
                                  ? "multipler_crash_value_message"
                                  : ""
                              }`}
                            >
                              {liveMultiplier !== "Starting..."
                                ? liveMultiplier + "x"
                                : "Starting..."}
                            </h1>
                          );
                        }
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
          <div className="col-xl-9 col-md-10 col-lg-8 col-sm-12 display-on-s">
            <div className="card game-main-div">
              {userData && userData !== "No User Authentication" ? (
                <div className="row">
                  <div className="card-body col-md-1 game-sub-card ps-4">
                    <h5 className="card-title"> Bet Amount</h5>
                    <input
                      className="form-control game-inp"
                      placeholder="&#x20b9;10.00"
                      style={{ width: "77%" }}
                      type="text"
                      aria-label="default input example"
                      onChange={(e) => verifyBetAmount(e.target.value)}
                      value={betAmount}
                      disabled={betActive ? "disabled" : null}
                      onKeyDown={handleKeyDownBetting}
                    />
                  </div>
                  <div className="card-body col-md-1 game-sub-card ps-4">
                    <h5 className="card-title">Auto Stop</h5>
                    <input
                      className="form-control game-inp"
                      placeholder="x 1.5"
                      style={{ width: "75%" }}
                      type="text"
                      aria-label="default input example"
                      onChange={(e) => verifyMultiplierAmount(e.target.value)}
                      onKeyDown={handleKeyDownBetting}
                      value={autoPayoutMultiplier}
                      disabled={betActive ? "disabled" : null}
                    />
                  </div>

                  {bBettingPhase && !betActive ? (
                    <div className="col-4 game-btn">
                      <button
                        className="btn btn-primary game-bet"
                        onClick={send_bet}
                      >
                        Send Bet
                      </button>
                    </div>
                  ) : (
                    <>
                      {betActive ? (
                        <div className="col-4 game-btn">
                          <button
                            className="btn btn-primary game-bet"
                            onClick={manual_cashout_early}
                          >
                            {" "}
                            {betActive && liveMultiplier > 1 ? (
                              <span>
                                Cashout at{" "}
                                {(liveMultiplier * betAmount).toFixed(2)}
                              </span>
                            ) : (
                              "Starting..."
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="col-4 game-btn">
                          <button
                            className={`btn btn-primary game-bet ${
                              bBetForNextRound
                                ? "bet_for_next_round_active"
                                : ""
                            }`}
                            onClick={bet_next_round}
                          >
                            {bBetForNextRound ? "Cancel Bet" : "Bet Next round"}{" "}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="row">
                  <div className="card-body col-md-1 game-sub-card ps-4">
                    <h5 className="card-title"> Bet Amount</h5>
                    <input
                      className="form-control game-inp"
                      placeholder="&#x20b9;10.00"
                      style={{ width: "77%" }}
                      type="text"
                      aria-label="default input example"
                    />
                  </div>
                  <div className="card-body col-md-1 game-sub-card ps-4">
                    <h5 className="card-title">Auto Stop</h5>
                    <input
                      className="form-control game-inp"
                      placeholder="x 1.5"
                      style={{ width: "75%" }}
                      type="text"
                      aria-label="default input example"
                    />
                  </div>
                  <div className="col-xl-4 game-btn">
                    <button type="submit" className="btn btn-primary game-bet">
                      BET
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="col-xl-3 col-lg-4 col-md-10 col-sm-12 mt-3 ml">
            <div className="card game-sidebar">
              <div className="card-body mrlf">
                <ul className="nav flex-column">
                  {userData && userData !== "No User Authentication" ? (
                    <>
                      <li className="card-subtitle margin-new ">
                        Balance:{userData.balance.toFixed(2)}
                      </li>
                      <li className="card-subtitle margin-new ">
                        Players: {[liveBettingTable].length}
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="card-subtitle margin-new display-big">
                        Balance: <span>&#x20b9;10,000</span>
                      </li>
                      <li className="card-subtitle margin-new ">
                        <i className="fa fa-user" aria-hidden="true"></i>
                        Players: 0
                      </li>
                    </>
                  )}
                </ul>
              </div>
              <div className="overflow-class">
                <table>
                  <tbody className="table table-striped" border="none">
                    {liveBettingTable && liveBettingTable !== "[]" ? (
                      <>
                        {JSON.parse(liveBettingTable).map((message) => {
                          return (
                            <tr>
                              <td className="bordertopleft">
                                <img src="" style={{ width: "54%" }} />
                              </td>
                              <td className="fontcolor">
                                {message.the_username}{" "}
                              </td>
                              <td className="bordertopright fontcolor">
                                <i className="fa fa-inr"></i>
                                {message.profit
                                  ? message.profit.toFixed(2)
                                  : "--"}
                              </td>
                            </tr>
                          );
                        })}
                      </>
                    ) : (
                      ""
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="col-xl-9 col-md-10 col-lg-8 col-sm-12 margin-class display-on-b">
            <div className="card game-main-div">
              {userData && userData !== "No User Authentication" ? (
                <div className="row">
                  <div className="card-body col-md-1 game-sub-card ps-4">
                    <h5 className="card-title"> Bet Amount</h5>
                    <input
                      className="form-control game-inp"
                      placeholder="&#x20b9;10.00"
                      style={{ width: "77%" }}
                      type="text"
                      aria-label="default input example"
                      onChange={(e) => verifyBetAmount(e.target.value)}
                      value={betAmount}
                      disabled={betActive ? "disabled" : null}
                      onKeyDown={handleKeyDownBetting}
                    />
                  </div>
                  <div className="card-body col-md-1 game-sub-card ps-4">
                    <h5 className="card-title">Auto Stop</h5>
                    <input
                      className="form-control game-inp"
                      placeholder="x 1.5"
                      style={{ width: "75%" }}
                      type="text"
                      aria-label="default input example"
                      onChange={(e) => verifyMultiplierAmount(e.target.value)}
                      onKeyDown={handleKeyDownBetting}
                      value={autoPayoutMultiplier}
                      disabled={betActive ? "disabled" : null}
                    />
                  </div>

                  {bBettingPhase && !betActive ? (
                    <div className="col-4 game-btn">
                      <button
                        className="btn btn-primary game-bet"
                        onClick={send_bet}
                      >
                        Send Bet
                      </button>
                    </div>
                  ) : (
                    <>
                      {betActive ? (
                        <div className="col-4 game-btn">
                          <button
                            className="btn btn-primary game-bet"
                            onClick={manual_cashout_early}
                          >
                            {" "}
                            {betActive && liveMultiplier > 1 ? (
                              <span>
                                Cashout at{" "}
                                {(liveMultiplier * betAmount).toFixed(2)}
                              </span>
                            ) : (
                              "Starting..."
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="col-4 game-btn">
                          <button
                            className={`btn btn-primary game-bet ${
                              bBetForNextRound
                                ? "bet_for_next_round_active"
                                : ""
                            }`}
                            onClick={bet_next_round}
                          >
                            {bBetForNextRound ? "Cancel Bet" : "Bet Next round"}{" "}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="row">
                  <div className="card-body col-md-1 game-sub-card ps-4">
                    <h5 className="card-title"> Bet Amount</h5>
                    <input
                      className="form-control game-inp"
                      placeholder="&#x20b9;10.00"
                      style={{ width: "77%" }}
                      type="text"
                      aria-label="default input example"
                    />
                  </div>
                  <div className="card-body col-md-1 game-sub-card ps-4">
                    <h5 className="card-title">Auto Stop</h5>
                    <input
                      className="form-control game-inp"
                      placeholder="x 1.5"
                      style={{ width: "75%" }}
                      type="text"
                      aria-label="default input example"
                    />
                  </div>
                  <div className="col-4 game-btn">
                    <button type="submit" className="btn btn-primary game-bet">
                      BET
                    </button>
                    {/* <button type="submit" onClick={handleSubmit}>
                      Sign up
                    </button> */}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="row"></div>
      </div>
    </div>
  );
}

export default App;
