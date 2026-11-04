import request from "umi-request";
import {citySchema, indicatorSchema} from "@/services/mockdata/schema";
import {indicatorValue} from "@/services/mockdata/indicator";
// import gadmActive from "@/services/mockdata/gadmActive";
// import gadmInactive from "@/services/mockdata/gadmInactive";
// import nuts3Active from "@/services/mockdata/nuts3Active";
// import nuts3Inactive from "@/services/mockdata/nuts3Inactive";
// import urauActive from "@/services/mockdata/urauActive";
// import urauInactive from "@/services/mockdata/urauInactive";

export async function getMapBoxToken(): Promise<string> {
    return "pk.eyJ1IjoibWF5YXp1cmUiLCJhIjoiY2x6anlqOHdpMHZzbDJqcjEyNGp1Mm42cCJ9.QYA7Mn84whsEC7Npj-ESzg";
}

export async function getCitySchema(): Promise<Array<City>> {
    return citySchema;
}

export async function getIndicatorSchema(): Promise<Array<Indicator>> {
    return indicatorSchema;
}

export async function searchValue(year: number, indicatorCode: string): Promise<Array<IndicatorValue>> {
    return indicatorValue.filter((item)=>{
        return item.year==year && item.indicator_code == indicatorCode;
    })
}

// export async function getBoundaries(name: string, split: string = "active"): Promise<object> {
//     const res = await request(`/api/tiles/boundaries/${split}/${name}`, {
//         method: 'GET'
//     })
//     return boundariesData[`${name}_${split}`]
// }
