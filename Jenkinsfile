pipeline {
    agent any

    stages {
        stage('Clone repository') {
            steps {
                git branch: 'main', url: 'https://github.com/raed20/E-commerce-App-main'
            }
        }

        stage('Install dependencies') {
            steps {
                bat 'call npm install'
            }
        }

        stage('Run unit tests') {
            steps {
                bat 'call npm run test -- --karma-config karma.conf.js --watch=false --code-coverage'
            }
        }

        stage('Build Angular Application') {
            steps {
                bat 'call npm run build'
            }
        }

        stage('Build Docker Image') {
            steps {
                bat 'docker build -t shopferimgg .'
            }
        }

        stage('Push Docker Image to Docker Hub') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-hub-login', usernameVariable: 'DOCKER_HUB_USER', passwordVariable: 'DOCKER_HUB_PASS')]) {
                    bat """
                        docker tag shopferimgg %DOCKER_HUB_USER%/shopferimgg:latest
                        docker login -u %DOCKER_HUB_USER% -p %DOCKER_HUB_PASS%
                        docker push %DOCKER_HUB_USER%/shopferimgg:latest
                    """
                }
            }
        }

        stage('Run Docker Container') {
            steps {
                script {
                    try {
                        bat '''
                            docker stop shopfer-container 2>nul || echo off
                            docker rm shopfer-container 2>nul || echo off
                        '''
                    } catch (Exception e) {
                        // Container cleanup failed - continue
                    }
                }

                bat 'docker run -d --name shopfer-container -p 4200:4200 shopferimgg'
            }
        }

        stage('Verify Application Status') {
            steps {
                script {
                    def maxAttempts = 30
                    def attempt = 0
                    def appStarted = false

                    while (attempt < maxAttempts && !appStarted) {
                        try {
                            sleep(2)
                            bat 'netstat -an | find "4200" | find "LISTENING"'
                            appStarted = true
                        } catch (Exception e) {
                            attempt++
                            if (attempt % 10 == 0) {
                                echo "Waiting for application... (${attempt}/${maxAttempts})"
                            }
                        }
                    }

                    if (!appStarted) {
                        error("Application failed to start within timeout")
                    }
                }
            }
        }

        stage('Setup Robot Framework Environment') {
            steps {
                bat '''
                    if not exist robot-tests mkdir robot-tests
                    cd robot-tests
                    if exist robot_env rmdir /s /q robot_env
                    python -m venv robot_env
                    robot_env\\Scripts\\python.exe -m pip install --upgrade pip --quiet
                    robot_env\\Scripts\\pip install robotframework robotframework-seleniumlibrary selenium webdriver-manager --quiet
                '''
            }
        }

        stage('Run Robot Framework tests') {
            steps {
                bat '''
                    cd robot-tests
                    robot_env\\Scripts\\robot --outputdir . ^
                                              --variable BROWSER:headlesschrome ^
                                              --variable URL:http://localhost:4200 ^
                                              --loglevel INFO ^
                                              hello.robot
                '''
            }
        }

        stage('Deploy to AKS') {
            environment {
                RESOURCE_GROUP = 'shopfer'
                CLUSTER_NAME = 'shopfer'
                TENANT_ID = 'dbd6664d-4eb9-46eb-99d8-5c43ba153c61'
                ACR_NAME = 'shopfer'
            }

            steps {
                withCredentials([usernamePassword(credentialsId: 'azure-sp', usernameVariable: 'AZURE_CLIENT_ID', passwordVariable: 'AZURE_CLIENT_SECRET')]) {
                    script {
                        try {
                            // Login to Azure and verify access
                            bat '''
                                echo "=== Logging into Azure ==="
                                az login --service-principal -u %AZURE_CLIENT_ID% -p %AZURE_CLIENT_SECRET% --tenant %TENANT_ID%

                                echo "=== Verifying AKS cluster access ==="
                                az aks show --resource-group %RESOURCE_GROUP% --name %CLUSTER_NAME% --query "name" -o tsv
                            '''

                            // Get AKS credentials
                            bat '''
                                echo "=== Getting AKS credentials ==="
                                az aks get-credentials --resource-group %RESOURCE_GROUP% --name %CLUSTER_NAME% --overwrite-existing

                                echo "=== Testing kubectl connection ==="
                                kubectl cluster-info
                                kubectl get nodes
                            '''

                            // Verify Kubernetes manifests exist
                            bat '''
                                echo "=== Verifying Kubernetes manifests ==="
                                if not exist "k8s" (
                                    echo "ERROR: k8s directory not found"
                                    exit /b 1
                                )
                                if not exist "k8s\\service.yaml" (
                                    echo "ERROR: k8s/service.yaml not found"
                                    exit /b 1
                                )
                                if not exist "k8s\\configmap.yaml" (
                                    echo "ERROR: k8s/configmap.yaml not found"
                                    exit /b 1
                                )
                                if not exist "k8s\\deployment.yaml" (
                                    echo "ERROR: k8s/deployment.yaml not found"
                                    exit /b 1
                                )
                                echo "All manifest files found"
                            '''

                            // Update deployment image with the correct Docker Hub reference
                            withCredentials([usernamePassword(credentialsId: 'docker-hub-login', usernameVariable: 'DOCKER_HUB_USER', passwordVariable: 'DOCKER_HUB_PASS')]) {
                                bat '''
                                    echo "=== Updating deployment image reference ==="
                                    powershell -Command "(Get-Content k8s\\deployment.yaml) -replace 'image:.*shopferimgg.*', 'image: %DOCKER_HUB_USER%/shopferimgg:latest' | Set-Content k8s\\deployment.yaml"
                                '''
                            }

                            // Apply Kubernetes manifests
                            bat '''
                                echo "=== Applying Kubernetes manifests ==="
                                kubectl apply -f k8s/configmap.yaml
                                kubectl apply -f k8s/service.yaml
                                kubectl apply -f k8s/deployment.yaml

                                echo "=== Waiting for deployment rollout ==="
                                kubectl rollout status deployment/shopfer --timeout=300s

                                echo "=== Deployment Status ==="
                                kubectl get pods -l app=shopfer
                                kubectl get services
                                kubectl describe deployment shopfer
                            '''

                        } catch (Exception e) {
                            echo "AKS deployment failed: ${e.getMessage()}"

                            // Comprehensive diagnostics
                            bat '''
                                echo "=== DEPLOYMENT DIAGNOSTICS ==="

                                echo "--- Current kubectl context ---"
                                kubectl config current-context 2>nul || echo "No kubectl context set"

                                echo "--- Cluster nodes ---"
                                kubectl get nodes 2>nul || echo "Cannot get nodes"

                                echo "--- All pods ---"
                                kubectl get pods --all-namespaces 2>nul || echo "Cannot get pods"

                                echo "--- Shopfer pods (if any) ---"
                                kubectl get pods -l app=shopfer 2>nul || echo "No shopfer pods found"

                                echo "--- Services ---"
                                kubectl get services 2>nul || echo "Cannot get services"

                                echo "--- Recent events ---"
                                kubectl get events --sort-by=.metadata.creationTimestamp --field-selector type!=Normal 2>nul || echo "Cannot get events"

                                echo "--- Deployment details ---"
                                kubectl describe deployment shopfer 2>nul || echo "No shopfer deployment found"

                                echo "--- ReplicaSet details ---"
                                kubectl describe rs -l app=shopfer 2>nul || echo "No shopfer replicasets found"

                                echo "--- Pod logs (if any pods exist) ---"
                                for /f %%i in ('kubectl get pods -l app^=shopfer -o name 2^>nul') do (
                                    echo "Logs for %%i:"
                                    kubectl logs %%i --tail=50 2>nul || echo "Cannot get logs for %%i"
                                )
                            '''

                            throw e
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                // Container cleanup
                try {
                    bat '''
                        docker stop shopfer-container 2>nul || echo off
                        docker rm shopfer-container 2>nul || echo off
                        for /F %%i in ('docker ps -q --filter "ancestor=shopferimgg" 2^>nul') do (
                            docker stop %%i 2^>nul && docker rm %%i 2^>nul
                        )
                    '''
                } catch (Exception e) {
                    // Cleanup failed - continue
                }

                // Process cleanup
                try {
                    bat '''
                        for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| find ":4200" ^| find "LISTENING"') do (
                            taskkill /f /pid %%a 2^>nul || echo off
                        )
                    '''
                } catch (Exception e) {
                    // Process cleanup failed - continue
                }

                // Publish Robot Framework results
                try {
                    if (fileExists('robot-tests/output.xml')) {
                        robot(
                            outputPath: 'robot-tests',
                            outputFileName: 'output.xml',
                            reportFileName: 'report.html',
                            logFileName: 'log.html',
                            disableArchiveOutput: false,
                            passThreshold: 80,
                            unstableThreshold: 60,
                            otherFiles: '*.png,*.jpg'
                        )
                    }
                } catch (Exception e) {
                    echo "Warning: Could not publish Robot Framework results"
                }

                // Archive artifacts
                try {
                    if (fileExists('robot-tests')) {
                        archiveArtifacts artifacts: 'robot-tests/**/*.{xml,html,log,png,jpg}', allowEmptyArchive: true, fingerprint: true
                    }
                } catch (Exception e) {
                    echo "Warning: Could not archive artifacts"
                }
            }
        }

        success {
            echo 'Pipeline completed successfully ✅'
            echo 'Application deployed to AKS cluster: shopfer'
        }

        failure {
            echo 'Pipeline failed ❌'

            // Enhanced diagnostic on failure
            script {
                try {
                    bat '''
                        echo === GENERAL DIAGNOSTIC ===
                        docker ps -a | find "shopfer" 2>nul || echo No shopfer containers
                        netstat -an | find "4200" 2>nul || echo Port 4200 not found
                        if exist robot-tests\\output.xml echo Robot test results available

                        echo === KUBERNETES DIAGNOSTIC ===
                        kubectl get pods -l app=shopfer 2>nul || echo No shopfer pods in AKS
                        kubectl get events --sort-by=.metadata.creationTimestamp | tail -5 2>nul || echo Cannot get recent events
                    '''
                } catch (Exception e) {
                    // Diagnostic failed - continue
                }
            }
        }
    }
}
