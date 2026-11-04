type City = {
    cgi_id: string;
    city_code: string;
    city_name: string;
    country: string;
    coordination: number[];
}

type Indicator = {
    indicator_code: string;
    source: string;
    cgi_indicator_code: string;
    indicator_domain: string;
    indicator_theme: string;
    indicator_sub_theme: string|null;
    indicator_name: string;
}

type IndicatorValue = {
    city_code: string,
    city_name: string,
    indicator_code: string,
    indicator_name: string,
    year: number,
    value: number,
    sheet_name: string
}
