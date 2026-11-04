import { Outlet } from 'umi';
import Header from "@/components/Header";

export default function Layout() {

    const loading = false;

    return (
        <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <div style={{ borderBottom: "1px solid #d8d8d8"}}>
                <Header/>
            </div>
            {
                loading?  (
                    <>Loading {loading} ...</>
                ):(
                    <div style={{ flex: 1, overflow:"hidden"}}>
                        <Outlet />
                    </div>
                )
            }
        </div>
    );
}
