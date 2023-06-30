import React, { useEffect, useState } from "react";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveBar } from "@nivo/bar";
import { Table } from "react-bootstrap";
import { useParams } from "react-router-dom";
import DashboardService from "../../services/DashboardServices";
import GeneralDashboard from "./GeneralDashboard";
import Sidebar from "./Sidebar";
import { OverlayTrigger, Tooltip } from "react-bootstrap";

const Dashboard = ({ view_id: propViewId }) => {
  const [data, setData] = useState([]);
  const { view_id: paramViewId } = useParams();
  const view_id = paramViewId || propViewId;
  const [metadata, setMetadata] = useState(null);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const metadataList = await DashboardService.getmetadata();
        setMetadata(metadataList);
      } catch (error) {
        // console.error("Erro ao buscar metadados: ", error);
      }
    };
    fetchMetadata();
  }, []);

  useEffect(() => {
    if (view_id !== "general") {
      const fetchData = async () => {
        try {
          const data = await DashboardService.getViewData(view_id);
                    const dataWithPercentage = data.map((item) => ({
            ...item,
            percentage: ((item.val / totalPedidos) * 100).toFixed(2),
          }));
          setData(dataWithPercentage);
        } catch (error) {
          // console.error("Erro ao buscar dados: ", error);
        }
      };
      fetchData();
    }
  }, [view_id]);


  

  const totalPedidos = data.reduce((total, item) => total + item.val, 0);

  // Aqui é onde você seleciona o objeto correto do array
  const currentMetadata =
    view_id === "general"
      ? { name: "Dashboard Geral", memo: "Descrição para o Dashboard Geral" }
      : metadata
      ? metadata.find((item) => item.pk.toString() === view_id) || {
          name: "Carregando...",
          memo: "Carregando...",
        }
      : { name: "Carregando...", memo: "Carregando..." };

  const renderChartByViewId = (currentMetadata) => {
    switch (view_id) {
      case "general":
        return {
          title: currentMetadata.name,
          description: currentMetadata.memo,
          content: <GeneralDashboard />,
        };
      case "1":
        const totalPedidos = data.reduce((total, item) => total + item.val, 0);
        return {
          title: currentMetadata.name,
          description: currentMetadata.memo,
          total: (
            <div style={{ textAlign: "center" }}>
              <p style={{ margin: 5 }}>Total de pedidos</p>
              <p style={{ fontWeight: "bold", margin: 5 }}>{totalPedidos}</p>
            </div>
          ),
          content: (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              <div
                className="dashboard-component"
                style={{ flex: "1", height: "430px", margin: "10px" }}
              >
                <h2 style={{ textAlign: "center" }}>Tabela de Dados</h2>
                <Table
                  striped
                  hover
                  responsive
                  className="table table-responsive table-sm "
                  overlay
                >
                  <thead>
                    <tr>
                      <th>Tipo de Pedidos</th>
                      <th>Qtd.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((item, index) => (
                      <tr key={index}>
                        <td>{item.par}</td>
                        <td>{item.val}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              <div
                className="dashboard-component"
                style={{
                  flex: "2",
                  height: "430px",
                  maxWidth: "800px",
                  maxHeight: "500px",
                  // overflow: "auto",
                  margin: "10px",
                }}
              >
                <h2 style={{ textAlign: "center" }}>Tipos de Pedidos</h2>
                <ResponsiveBar
                  data={data}
                  keys={["val"]}
                  indexBy="par"
                  margin={{ top: 50, right: 60, bottom: 120, left: 90 }}
                  padding={0.3}
                  axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 15,
                    legendPosition: "middle",
                    legendOffset: 100,
                  }}
                />
              </div>
            </div>
          ),
        };
      case "2":
        return {
          title: currentMetadata.name,
          description: currentMetadata.memo,
          content: (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <div
                className="dashboard-component"
                style={{ width: "90%", height: "500px", margin: "10px" }}
              >
                <h2 style={{ textAlign: "center" }}>
                  Total de Pedidos por concelho
                </h2>
                <ResponsiveBar
                  data={data}
                  keys={["val"]}
                  indexBy="par"
                  margin={{ top: 50, right: 0, bottom: 100, left: 40 }}
                  padding={0.3}
                  axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    // tickRotation: 15, // -45 graus de rotação
                    legendPosition: "middle",
                    legendOffset: 100, // ajustar a posição da legenda
                  }}
                />
              </div>
            </div>
          ),
        };
      case "3":
        console.log(data);
        const allKeys = Array.from(new Set(data.map((item) => item.par2)));
        const transformedData = data.reduce((acc, item) => {
          const existingItem = acc.find((i) => i.par1 === item.par1);
          if (existingItem) {
            existingItem[item.par2] = item.val;
          } else {
            const newItem = { par1: item.par1 };
            allKeys.forEach((key) => {
              newItem[key] = key === item.par2 ? item.val : 0;
            });
            acc.push(newItem);
          }
          return acc;
        }, []);
        const allMunicipios = Array.from(
          new Set(data.map((item) => item.par1))
        );
        const transformedDataByPar2 = data.reduce((acc, item) => {
          const existingItem = acc.find((i) => i.par2 === item.par2);
          if (existingItem) {
            existingItem[item.par1] = item.val;
          } else {
            const newItem = { par2: item.par2 };
            allMunicipios.forEach((municipio) => {
              newItem[municipio] = municipio === item.par1 ? item.val : 0;
            });
            acc.push(newItem);
          }
          return acc;
        }, []);

        // Importe a biblioteca Chroma.js
        const chroma = require("chroma-js");

        // Gere um esquema de cores usando Chroma.js
        const colorScale = chroma
          .scale([
            "#DFFF00",
            "#FFBF00",
            "#FF7F50",
            "#DE3163",
            "#9FE2BF",
            "#40E0D0",
            "#6495ED",
            "#CCCCFF",
          ])
          .mode("lch")
          .colors(allKeys.length);

        // Atribua as cores aos tipos de pedidos
        const colors = allKeys.reduce((colors, type, i) => {
          colors[type] = colorScale[i];
          return colors;
        }, {});

        const pieData = data.reduce((acc, item) => {
          const existingItem = acc.find((i) => i.id === item.par1);
          if (existingItem) {
            existingItem.value += item.val;
          } else {
            acc.push({ id: item.par1, value: item.val });
          }
          return acc;
        }, []);

        const municipiosData = allMunicipios.map((municipio) => {
          const municipioData = data.filter((item) => item.par1 === municipio);
          const totalPedidosMunicipio = municipioData.reduce(
            (total, item) => total + item.val,
            0
          );
          const pieDataMunicipio = municipioData.reduce((acc, item) => {
            const existingItem = acc.find((i) => i.id === item.par2);
            if (existingItem) {
              existingItem.value += item.val;
            } else {
              acc.push({ id: item.par2, value: item.val });
            }
            return acc;
          }, []);
          return {
            municipio,
            data: pieDataMunicipio,
            totalPedidos: totalPedidosMunicipio,
          };
        });

        function convertToHours(duration) {
          const daysMatcher = duration.match(/(\d+)\s*days/);
          const timeMatcher = duration.match(/(\d{2}):(\d{2}):(\d{2})/);

          const days = daysMatcher ? Number(daysMatcher[1]) : 0;
          const hours = timeMatcher ? Number(timeMatcher[1]) : 0;
          const minutes = timeMatcher ? Number(timeMatcher[2]) : 0;
          const seconds = timeMatcher ? Number(timeMatcher[3]) : 0;

          const totalHours = days * 24 + hours + minutes / 60 + seconds / 3600;

          return totalHours;
        }

        // console.log("transforme", transformedData);

        // Verifique se transformedData não está vazia
        if (!transformedData.length) {
          return <div>Não há dados para exibir</div>;
        }

        return {
          title: currentMetadata.name,
          description: currentMetadata.memo,
          content: (
            <div className="dashboard-row">
              {municipiosData
                .slice(0, 5)
                .map(({ municipio, data, totalPedidos }) => (
                  <div
                    className="dashboard-total-component"
                    style={{ height: "250px", position: "relative" }}
                    key={municipio}
                  >
                    <h6
                      style={{
                        textAlign: "center",
                        position: "absolute",
                        top: 5,
                      }}
                    >
                      {municipio}
                    </h6>
                    <ResponsivePie
                      data={data}
                      margin={{ top: 30, right: 10, bottom: 20, left: 10 }}
                      innerRadius={0.5}
                      padAngle={0.7}
                      cornerRadius={3}
                      activeOuterRadiusOffset={8}
                      borderWidth={1}
                      borderColor={{ theme: "background" }}
                      enableArcLinkLabels={false}
                      arcLabelsSkipAngle={10}
                      arcLabelsTextColor="#333333"
                      colors={({ id }) => colors[id]}
                    />

                    <OverlayTrigger
                      placement="top"
                      overlay={
                        <Tooltip id={`tooltip-top`}>Total de pedidos</Tooltip>
                      }
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          textAlign: "center",
                          fontSize: 20,
                        }}
                      >
                        <strong>{totalPedidos}</strong>
                      </div>
                    </OverlayTrigger>
                  </div>
                ))}
              <div className="dashboard-component" style={{ height: "650px" }}>
                <h2>Gráfico de Barras Empilhadas por Tipo de Pedido</h2>
                <ResponsiveBar
                  data={transformedDataByPar2}
                  keys={Object.keys(transformedDataByPar2[0]).filter(
                    (key) => key !== "par2"
                  )}
                  indexBy="par2"
                  groupMode="stacked"
                  margin={{ top: 50, right: 100, bottom: 160, left: 60 }}
                  padding={0.3}
                  axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 10, // -45 graus de rotação
                    legendPosition: "middle",
                    legendOffset: 100, // ajustar a posição da legenda
                  }}
                  legends={[
                    {
                      dataFrom: "keys",
                      anchor: "bottom", // alterado para 'bottom'
                      direction: "row", // alterado para 'row'
                      justify: false,
                      translateX: 0, // pode precisar ser ajustado
                      translateY: 70, // pode precisar ser ajustado
                      itemsSpacing: 70,
                      itemWidth: 120,
                      itemHeight: 5,
                      itemDirection: "left-to-right",
                      itemOpacity: 0.85,
                      symbolSize: 11,
                      fontWeight: 2,
                      effects: [
                        {
                          on: "hover",
                          style: {
                            itemOpacity: 1,
                          },
                        },
                      ],
                    },
                  ]}
                />
              </div>
            </div>
          ),
        };
      case "4":
        // console.log("data", data);

        const transformedDataStatusOrders = data.map((item) => {
          return {
            id: item.par,
            label: item.par,
            value: item.val1,
          };
        });

        const totalOrders = transformedDataStatusOrders.reduce(
          (acc, curr) => acc + curr.value,
          0
        );

        const transformedDataStatusTimes = data.map((item) => {
          return {
            state: item.par,
            "Tempo Mínimo (dias)": (item.val2 / 24).toFixed(0),
            "Tempo Máximo (dias)": (item.val3 / 24).toFixed(0),
            "Tempo Médio (dias)": (item.val4 / 24).toFixed(0),
          };
        });

        // Função que gera as regras de preenchimento
        const generateFill = (data) => {
          return data.map((item, index) => {
            const patternId = index % 2 === 0 ? "dots" : "lines"; // Alternar entre "dots" e "lines"
            return {
              match: {
                id: item.id, // item.id deve corresponder ao ID do estado
              },
              id: patternId,
            };
          });
        };

        // console.log(transformedDataStatusOrders);
        // console.log(transformedDataStatusTimes);

        return {
          title: currentMetadata.name,
          description: currentMetadata.memo,
          content: (
            <div className="dashboard-rows">
              <div style={{ display: "flex", height: "600px" }}>
                <div
                  className="dashboard-component"
                  style={{ flex: 1, height: "auto", marginRight: "1%" }}
                >
                  <h2 style={{ textAlign: "center" }}>
                    Tempos de Tratamento por Estado
                  </h2>
                  {transformedDataStatusTimes &&
                    transformedDataStatusTimes.length > 0 && (
                      <ResponsiveBar
                        data={transformedDataStatusTimes}
                        keys={[
                          "Tempo Mínimo (dias)",
                          "Tempo Máximo (dias)",
                          "Tempo Médio (dias)",
                        ]}
                        indexBy="state"
                        margin={{ top: 50, right: 20, bottom: 180, left: 50 }}
                        padding={0.3}
                        valueScale={{ type: "linear" }}
                        indexScale={{ type: "band", round: true }}
                        colors={{ scheme: "nivo" }}
                        borderColor={{
                          from: "color",
                          modifiers: [["darker", 1.6]],
                        }}
                        axisTop={null}
                        axisRight={null}
                        axisBottom={{
                          tickSize: 5,
                          tickPadding: 5,
                          tickRotation: 0,
                          legend: "Estado",
                          legendPosition: "middle",
                          legendOffset: 32,
                        }}
                        axisLeft={{
                          tickSize: 4,
                          tickPadding: 4,
                          tickRotation: 0,
                          legend: "Dias",
                          legendPosition: "middle",
                          legendOffset: -40,
                        }}
                        labelSkipWidth={12}
                        labelSkipHeight={12}
                        labelTextColor={{
                          from: "color",
                          modifiers: [["darker", 1.6]],
                        }}
                        legends={[
                          {
                            dataFrom: "keys",
                            anchor: "bottom", // alterado para 'bottom'
                            direction: "row", // alterado para 'row'
                            justify: false,
                            translateX: 0, // pode precisar ser ajustado
                            translateY: 70, // pode precisar ser ajustado
                            itemsSpacing: 50,
                            itemWidth: 100,
                            itemHeight: 20,
                            itemDirection: "left-to-right",
                            itemOpacity: 0.85,
                            symbolSize: 15,
                            fontWeight: 2,
                            effects: [
                              {
                                on: "hover",
                                style: {
                                  itemOpacity: 1,
                                },
                              },
                            ],
                          },
                        ]}
                      />
                    )}
                </div>
                <div
                  className="dashboard-component"
                  style={{ flex: 1, height: "auto" }}
                >
                  <h2 style={{ textAlign: "center" }}>
                    Total de Pedidos por Estado
                  </h2>
                  {transformedDataStatusOrders &&
                    transformedDataStatusOrders.length > 0 && (
                      <ResponsivePie
                        data={transformedDataStatusOrders}
                        margin={{ top: 50, right: 150, bottom: 190, left: 150 }}
                        innerRadius={0.5}
                        padAngle={0.7}
                        cornerRadius={3}
                        activeOuterRadiusOffset={8}
                        borderWidth={1}
                        borderColor={{
                          from: "color",
                          modifiers: [["darker", 0.2]],
                        }}
                        arcLinkLabelsSkipAngle={10}
                        arcLinkLabelsTextColor="#333333"
                        arcLinkLabelsThickness={2}
                        arcLinkLabelsColor={{ from: "color" }}
                        arcLabelsSkipAngle={10}
                        arcLabelsTextColor={{
                          from: "color",
                          modifiers: [["darker", 2]],
                        }}
                        center={
                          <text textAnchor="middle" dominantBaseline="middle">
                            {`Total: ${totalOrders}`}
                          </text>
                        }
                        defs={[
                          {
                            id: "dots",
                            type: "patternDots",
                            background: "inherit",
                            color: "rgba(255, 255, 255, 0.3)",
                            size: 4,
                            padding: 1,
                            stagger: true,
                          },
                          {
                            id: "lines",
                            type: "patternLines",
                            background: "inherit",
                            color: "rgba(255, 255, 255, 0.3)",
                            rotation: -45,
                            lineWidth: 6,
                            spacing: 10,
                          },
                        ]}
                        fill={generateFill(data)}
                        legends={[
                          {
                            anchor: "bottom",
                            direction: "row",
                            justify: false,
                            translateX: 0,
                            translateY: 56,
                            itemsSpacing: 0,
                            itemWidth: 100,
                            itemHeight: 18,
                            itemTextColor: "#999",
                            itemDirection: "left-to-right",
                            itemOpacity: 1,
                            symbolSize: 18,
                            symbolShape: "circle",
                            effects: [
                              {
                                on: "hover",
                                style: {
                                  itemOpacity: 1,
                                },
                              },
                            ],
                          },
                        ]}
                      />
                    )}
                </div>
              </div>
            </div>
          ),
        };
      case "5":
        const transformedDataStatusOrdersCase5 = data.map((item) => {
          return {
            id: item.par,
            label: item.par,
            value: item.val1,
          };
        });

        const totalOrdersCase5 = transformedDataStatusOrdersCase5.reduce(
          (acc, curr) => acc + curr.value,
          0
        );

        const transformedDataStatusTimesCase5 = data
          .filter((item) => item.par !== "ANULADO" && item.par !== "CONCLUIDO")
          .map((item) => {
            return {
              state: item.par,
              "Quantidade de Pedidos": item.val1,
              "Tempo Mínimo (dias)": (item.val2 / 24).toFixed(0),
              "Tempo Médio (dias)": (item.val3 / 24).toFixed(0),
              "Tempo Máximo (dias)": (item.val4 / 24).toFixed(0),
            };
          });

        const generateFillcase5 = (data) => {
          return data.map((item, index) => {
            const patternId =
              index % 3 === 0 ? "dots" : index % 3 === 1 ? "lines" : "squares";
            return {
              match: {
                id: item.id,
              },
              id: patternId,
            };
          });
        };

        return {
          title: currentMetadata.name,
          description: currentMetadata.memo,
          content: (
            <div className="dashboard-rows">
              <div style={{ display: "flex", height: "600px" }}>
                <div
                  className="dashboard-component"
                  style={{ flex: 1, height: "auto", marginRight: "1%" }}
                >
                  <h2 style={{ textAlign: "center" }}>
                    Tempos de Tratamento por Estado
                  </h2>
                  <ResponsiveBar
                    data={transformedDataStatusTimesCase5}
                    keys={[
                      "Tempo Mínimo (dias)",
                      "Tempo Médio (dias)",
                      "Tempo Máximo (dias)",
                    ]}
                    indexBy="state"
                    margin={{ top: 50, right: 20, bottom: 180, left: 50 }}
                    padding={0.3}
                    valueScale={{ type: "linear" }}
                    indexScale={{ type: "band", round: true }}
                    colors={{ scheme: "nivo" }}
                    borderColor={{
                      from: "color",
                      modifiers: [["darker", 1.6]],
                    }}
                    axisTop={null}
                    axisRight={null}
                    axisBottom={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: "Estado",
                      legendPosition: "middle",
                      legendOffset: 32,
                    }}
                    axisLeft={{
                      tickSize: 4,
                      tickPadding: 4,
                      tickRotation: 0,
                      legend: "Dias",
                      legendPosition: "middle",
                      legendOffset: -40,
                    }}
                    labelSkipWidth={12}
                    labelSkipHeight={12}
                    labelTextColor={{
                      from: "color",
                      modifiers: [["darker", 1.6]],
                    }}
                    legends={[
                      {
                        dataFrom: "keys",
                        anchor: "bottom",
                        direction: "row",
                        justify: false,
                        translateX: 0,
                        translateY: 70,
                        itemsSpacing: 50,
                        itemWidth: 100,
                        itemHeight: 20,
                        itemDirection: "left-to-right",
                        itemOpacity: 0.85,
                        symbolSize: 15,
                        fontWeight: 2,
                        effects: [
                          {
                            on: "hover",
                            style: {
                              itemOpacity: 1,
                            },
                          },
                        ],
                      },
                    ]}
                  />
                </div>
                <div
                  className="dashboard-component"
                  style={{ flex: 1, height: "auto" }}
                >
                  <h2 style={{ textAlign: "center" }}>
                    Total de Pedidos por Estado
                  </h2>
                  <ResponsivePie
                    data={transformedDataStatusOrdersCase5}
                    margin={{ top: 50, right: 150, bottom: 190, left: 150 }}
                    innerRadius={0.5}
                    padAngle={0.7}
                    cornerRadius={3}
                    activeOuterRadiusOffset={8}
                    borderWidth={1}
                    borderColor={{
                      from: "color",
                      modifiers: [["darker", 0.2]],
                    }}
                    arcLinkLabelsSkipAngle={10}
                    arcLinkLabelsTextColor="#333333"
                    arcLinkLabelsThickness={2}
                    arcLinkLabelsColor={{ from: "color" }}
                    arcLabelsSkipAngle={10}
                    arcLabelsTextColor={{
                      from: "color",
                      modifiers: [["darker", 2]],
                    }}
                    center={
                      <text textAnchor="middle" dominantBaseline="middle">
                        {`Total: ${totalOrdersCase5}`}
                      </text>
                    }
                    defs={[
                      {
                        id: "dots",
                        type: "patternDots",
                        background: "inherit",
                        color: "rgba(255, 255, 255, 0.3)",
                        size: 4,
                        padding: 1,
                        stagger: true,
                      },
                      {
                        id: "lines",
                        type: "patternLines",
                        background: "inherit",
                        color: "rgba(255, 255, 255, 0.3)",
                        rotation: -45,
                        lineWidth: 6,
                        spacing: 10,
                      },
                      {
                        id: "squares",
                        type: "patternSquares",
                        background: "inherit",
                        color: "rgba(255, 255, 255, 0.3)",
                        size: 6,
                        padding: 1,
                      },
                    ]}
                    fill={generateFillcase5(data)}
                    legends={[
                      {
                        anchor: "bottom",
                        direction: "row",
                        justify: false,
                        translateX: 0,
                        translateY: 56,
                        itemsSpacing: 0,
                        itemWidth: 100,
                        itemHeight: 18,
                        itemTextColor: "#999",
                        itemDirection: "left-to-right",
                        itemOpacity: 1,
                        symbolSize: 18,
                        symbolShape: "circle",
                        effects: [
                          {
                            on: "hover",
                            style: {
                              itemOpacity: 1,
                            },
                          },
                        ],
                      },
                    ]}
                  />
                </div>
              </div>
            </div>
          ),
        };
      case "6":                  
      case "7":
      case "8":
      case "9":
        return {};

      default:
        return <h1>Nada para apresentar</h1>;
    }
  };

  const renderContent = renderChartByViewId(currentMetadata);


  return (
    <>
      <Sidebar />
      <div className="dashboard-container">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <div>
            <h1>{renderContent.title}</h1>
            <p>{renderContent.description}</p>
          </div>
            {renderContent.total && (
            <div className="dashboard-to-component">
              <p>{renderContent.total}</p>
            </div>
          )}
        </div>
        <div>{renderContent.content}</div>
      </div>
    </>
  );
};



export default Dashboard;