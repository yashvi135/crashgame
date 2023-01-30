import React from "react";

import "chart.js/auto";
import { Chart, Line } from "react-chartjs-2";
import moment from "moment";
import "chartjs-adapter-moment";

//--------------------------------------------------------------------------------------------------------------
function SomeChart({ chartData, chartOptions }) {
  //   Chart.pluginService.register({
  //     afterUpdate: function (chart) {
  //       chart.config.data.datasets[1]._meta[0].data[5]._model.pointStyle = cloud;
  //     },
  //   });
  return (
    <>
      <div>
        <Chart
          id="myChart"
          height="145% !important"
          type="line"
          data={chartData}
          options={chartOptions}
        />
      </div>
    </>
  );
}

export default SomeChart;
