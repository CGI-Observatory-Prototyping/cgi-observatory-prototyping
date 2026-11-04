import {useState} from "react";
import {Button, Divider} from "antd";
import {BugOutlined} from "@ant-design/icons";

interface DebugInfoProps {
    data?: any[]
}

export default function DebugInfo(props: DebugInfoProps): React.ReactNode {

    const {data} = props;

    const [hide, setHide] = useState(true);

    return (
        <div style={{
            position:"absolute", right:"8px", bottom:"8px",
            zIndex:999999,
        }}>
            <Button onClick={()=>setHide(!hide)} icon={<BugOutlined />}/>
            {!hide&&data&&(
                <div style={{
                    maxHeight:"40vh", maxWidth:"40vw",
                    whiteSpace:"pre-wrap", overflow:"auto",
                    background:"rgba(255,255,255,0.78)",
                    border:"1px solid rgba(0,0,0,0.5)",
                    padding:"10px",
                }}>
                    <p style={{color:"rgb(108,0,0)", textAlign:"center"}}>Debugging Info - For dev only</p>
                    <Divider/>
                    {data.map((item, idx)=>(
                        <div key={idx}>
                            {JSON.stringify(item, null, 2)}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
