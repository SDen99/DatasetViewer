self.loadPyodide=await import("https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.mjs");let o=null;function i(){async function n(){try{o=await(await import("https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.mjs")).loadPyodide({indexURL:"https://cdn.jsdelivr.net/pyodide/v0.24.1/full/",stderr:r=>console.error("Python Error:",r)}),await o.loadPackage("pandas"),self.postMessage({type:"PYODIDE_READY",taskId:"init"})}catch(e){console.error("Pyodide initialization error:",e),self.postMessage({type:"PYODIDE_ERROR",taskId:"init",error:e.message})}}n()}i();async function d(n){if(!o)throw new Error("Pyodide not initialized");try{const e=new Uint8Array(n);o.FS.writeFile("/tmpfile.sas7bdat",e);const r=await o.runPythonAsync(`
            import pandas as pd
            import warnings
            import json
            import numpy as np

            def convert_bytes(obj):
                if isinstance(obj, bytes):
                    return obj.decode('utf-8', errors='ignore')
                if isinstance(obj, (np.integer, int)):
                    return int(obj)
                if isinstance(obj, (np.floating, float)):
                    return float(obj)
                if isinstance(obj, (np.ndarray, list)):
                    return [x for x in obj] if hasattr(obj, 'tolist') else obj
                if isinstance(obj, pd.Timestamp):
                    return obj.isoformat()
                if pd.isna(obj):
                    return None
                raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")

            try:
                # Read the SAS file using pandas
                df = pd.read_sas('/tmpfile.sas7bdat', format='sas7bdat')
                df = df.where(pd.notnull(df), None)
                
                # Convert int32 columns to regular integers
                for col in df.select_dtypes(include=['int32']).columns:
                    df[col] = df[col].astype(int)

                # Create the details dictionary with dataset information
                details = {
                    'num_rows': int(df.shape[0]),  # Convert numpy.int64 to regular int
                    'num_columns': int(df.shape[1]),
                    'columns': df.columns.tolist(),
                    'dtypes': df.dtypes.astype(str).to_dict(),
                    'summary': df.describe().replace({np.nan: None}).to_dict(),
                    'unique_values': {col: df[col].unique().tolist() 
                                    for col in df.select_dtypes(include=['object']).columns}
                }

                # Convert the data to JSON format
                json_data = df.to_json(orient='records', date_format='iso', 
                                     default_handler=convert_bytes)
                                     
                # Combine details and data into final result
                result = json.dumps({'details': details, 'data': json_data}, 
                                  default=convert_bytes)
            except Exception as e:
                result = json.dumps({'error': str(e)})

            result  # Return the JSON string
        `),t=JSON.parse(r);if(t.error)throw new Error(t.error);return t.data=JSON.parse(t.data),t}catch(e){throw console.error("Processing error:",e),e}finally{try{o.FS.unlink("/tmpfile.sas7bdat")}catch(e){console.warn("Cleanup error:",e)}}}self.onmessage=async n=>{const{type:e,taskId:r,file:t,fileName:l}=n.data;if(e==="PROCESS_FILE"){const a=performance.now();try{const s=await d(t);self.postMessage({type:"PROCESSING_COMPLETE",taskId:r,result:s,processingTime:(performance.now()-a)/1e3})}catch(s){self.postMessage({type:"PROCESSING_ERROR",taskId:r,error:s.message,processingTime:(performance.now()-a)/1e3})}}};
