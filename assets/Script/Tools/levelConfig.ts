import { js, JsonAsset } from "cc";
import { App } from "../Controller/app";
import { Constant, LevelData, mapData } from "./enumConst";
import GameData from "../Common/GameData";
import LoaderManeger from "../sysloader/LoaderManeger";
import CM from "../channel/CM";

class config {


    async getLevelData(id: number | string): Promise<LevelData> {
        let data = await this.getGridData(id);
        let list = [];
        for (let i = 0; i < data.mapData[0].m_id.length; i++) {
            let item = data.mapData[0].m_id[i];
            if (item > 5) {
                data.mapData[0].m_id[i] = this.handleIdArr(item);
            }
            let idx = list.indexOf(data.mapData[0].m_id[i]);
            if (idx < 0) {
                list.push(data.mapData[0].m_id[i])
            }
        };
        data.mapData[0].m_id = list;
        return data;
    }
  //"201": 201,//3,
    handleIdArr(id: number) {
        let numObj = {
            "201": 3,
            "410": 4,
            "50": 0,
            "51": 1,
            "100": 2,
            "208": 4,
            "420": 0,
            "400": 1,
            "404": 2,
            "409": 3,
            "411": 0,
            "412": 1,
            "413": 2,
            "415": 3,
            "416": 4,
            "417": 0,
            "418": 1,
            "423": 2,
        }
        return numObj[`${id}`] || 0;
    }

    async getGridData(id: number | string): Promise<LevelData> {
        if (+id > 1700) id = (+id % 1700) + 1;
        // let json: JsonAsset = await ResLoadHelper.loadCommonAssetSync(`config/${id}`, JsonAsset);
        let json: JsonAsset = await LoaderManeger.instance.loadJSON(`config/${id}`) as JsonAsset;
        let loadData = json['json'] as LevelData;
        return loadData;
    }
}

export let LevelConfig = new config();
