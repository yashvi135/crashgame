import React, { useEffect, useState } from "react";

import anime from "animejs";
import Rocket from "../assets/rocket.png";
import colors from "../helper/colors";
import { Line } from "react-chartjs-2";
import SomeChart from "../components/SomeChart";
import part1 from "../assets/parts/back.png";
import part2 from "../assets/parts/front.png";
import part3 from "../assets/parts/middle_back.png";
import part4 from "../assets/parts/middle.png";
import part5 from "../assets/parts/top.png";

export default function App() {

    
    var [indicatorAnime,setIndicatorAnime] = useState(null); 
    var [lineAnime,setLineAnime] = useState(null);
    var [goingUpAnimation,setGoingUp] = useState(null);
    var [vibrateAnimation,setVibrateAnimation] = useState(null);
    
    var [changeColortoRed,setChangeColor] = useState(false);
    const [chartData, setChartData] = useState({ datasets: [] });
    const [chartOptions, setChartOptions] = useState({});
    var [changeVal,setVal] = useState(false);
 
      const sendToChart=()=>{
        setChartData({
            
            labels: ['January', 'February', 'March',
                 'April', 'May'],
        datasets: [
          {
           
            fill: false,
            lineTension: 0.5,
            backgroundColor: 'rgba(0,0,0,0)',
            borderColor: 'rgba(0,0,0,1)',
            borderWidth: 2,
            data: [65, 59, 80, 81, 56]
          }
        ]
          });
      }
    useEffect(() => {
        let motion_path = anime.path("#Path_1");
        setIndicatorAnime(anime({
                targets: ".indicator",
                translateX: motion_path("x"),
                translateY: motion_path("y"),
                rotate: motion_path("angle"),
                easing: "linear",
                duration: 4000,
                loop: true,
                autoplay: false
            }));

        setLineAnime(anime({
                targets: "#Path_1",
                strokeDashoffset: [anime.setDashoffset, 0],
                easing: "linear",
                duration: 4000,
                loop: true,
                autoplay: false
            }));
        
        setGoingUp(anime({
            targets:"#rocket",
            translateX: 2,
            loop:true,
            autoplay:false,
            easing:"linear",
            duration:1000,
        }));

        setVibrateAnimation(anime({
            targets: '#parts div',
            translateX: function() { return anime.random(-10, 10) + 'rem'; },
            translateY: function() { return anime.random(-3, 5) + 'rem'; },
            scale: function() { return anime.random(10,20) / 10; },
            rotate: function() { return anime.random(-360,360); },
            duration: function() { return anime.random(800,1200); },
            easing: 'easeOutQuart',
            autoplay:false,
          }));
    }, []);

    //Start
    const handlePlay = () => {
        
        //Play line and indicator animation
        indicatorAnime.play();
        lineAnime.play();

        goingUpAnimation.pause();
        vibrateAnimation.pause();

        //Don't change color to red
        setChangeColor(false);
        setVal(false);
    };

    //Game Over
    const handlePause = () => {

        //Pause all Animations
        indicatorAnime.pause();
        lineAnime.pause();
        goingUpAnimation.pause();
        
        //Vibrate and Brake
        setChangeColor(true);

        //Play Vibrate Animation
        vibrateAnimation.play();

        setVal(true);
    };

    //Pause and Start
    const handleRestart = () => {
        
        //Restart Indicator and Line Animation from First
        indicatorAnime.restart();
        lineAnime.restart();

        //Pause Going up animation and vibrate animation
        goingUpAnimation.pause();
        vibrateAnimation.pause();
        
        //Don't change color
        setChangeColor(false);

        setVal(false);
    };

    //Pause and Reset to 0
    const handleReset = () => {
        
        //Pause all animations
        indicatorAnime.pause();
        lineAnime.pause();
        goingUpAnimation.pause();
        vibrateAnimation.pause();

        //Reset all animations
        indicatorAnime.seek(0);
        lineAnime.seek(0);
        goingUpAnimation.seek(0);
        vibrateAnimation.seek(0);

        //Reset Color
        setChangeColor(false);

        setVal(false);
    };

    //Go up
    const handleGoingUp = () => {

        //Pause Indicator and line Animation
        indicatorAnime.pause();
        lineAnime.pause();
        vibrateAnimation.pause();

        //Play Going Up animation
        goingUpAnimation.play();

        setVal(false);
    };

    return (
        
        <div style={{padding:100}}>
        <svg width="478.6" height="266.43">
            <g id="Group_1" transform="translate(5.826 -82.125)">
            <path
                id="Path_1"
                d="M-2.5,13.519S228.213,29.276,341.67-22.37,452.347-198.137,452.347-198.137"
                transform="translate(2.274 300.5)"
                fill="none"
                stroke={changeColortoRed ? colors.red : colors.primary}
                strokeLinecap="round"
                strokeWidth="10"
            />
            </g>
        </svg>
      
        <div
            id="circle"
            className="indicator"
            style={{
            width: 20,
            height: 20,
            borderRadius: 20,
            background: changeColortoRed ? colors.red : colors.primary,
            position: "relative",
            bottom: 65
            }}
        >
            <div id="rocket" style={{display:changeVal ? "none" : "block"}}>
                <img src={Rocket} alt="image1" style={{width:100,position:'relative',right:50,bottom:30}}/>
            </div>

            <div id="parts" style={{position:'relative',right:50,bottom:80,display:changeVal ? "flex":"none"}}>
                <div>
                    <img src={part1} style={{width:30}} alt="part1"/>
                </div>
                <div>
                    <img src={part3} style={{width:30}} alt="part3"/>
                </div>
                <div>
                    <img src={part4} style={{width:40}} alt="part4"/>
                </div>
                <div>
                    <img src={part5} style={{width:30}} alt="part5"/>
                </div>
                <div>
                    <img src={part2} style={{width:20}} alt="part2"/>
                </div>
            </div>
        </div>
        

        <button onClick={handlePlay}>Play</button>
        <button onClick={handlePause} style={{ marginLeft: 10 }}>
            Stop
        </button>
        <button onClick={handleRestart} style={{ marginLeft: 10 }}>
            Restart
        </button>
        <button onClick={handleReset} style={{ marginLeft: 10 }}>
            Reset
        </button>
        <button onClick={handleGoingUp} style={{ marginLeft: 10 }}>
            Pause for Up
        </button>
       <div>
       <Line
          data={chartData}
          options={{
            title:{
              display:true,
              text:'Average Rainfall per month',
              fontSize:20
            },
            legend:{
              display:true,
              position:'right'
            }
          }}
        />
       </div>
    </div>
  );
}
