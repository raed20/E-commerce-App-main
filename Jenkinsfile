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

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv(credentialsId: 'SQube-token', installationName: 'SonarQube') {
                    script {
                        def scannerHome = tool 'SonarScanner'
                        bat "\"${scannerHome}\\bin\\sonar-scanner.bat\" -Dsonar.projectKey=E-commerce-App-main -Dsonar.sources=src"
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
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

        stage('Pre-deployment Cleanup') {
            steps {
                script {
                    try {
                        bat '''
                            docker stop shopfer-container 2>nul || echo Container not running
                            docker rm shopfer-container 2>nul || echo Container not found
                            for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| find ":4200" ^| find "LISTENING"') do (
                                taskkill /f /pid %%a 2^>nul || echo Process cleanup
                            )
                        '''
                    } catch (Exception e) {
                        echo "Pre-deployment cleanup completed"
                    }
                }
            }
        }

        stage('Run Docker Container') {
            steps {
                bat 'docker run -d --name shopfer-container -p 4200:4200 shopferimgg'

                // Verify container started
                script {
                    sleep(5)
                    def containerStatus = bat(script: 'docker ps --filter "name=shopfer-container" --format "{{.Status}}"', returnStdout: true).trim()
                    if (!containerStatus.contains("Up")) {
                        error("Container failed to start properly")
                    }
                    echo "Container started successfully: ${containerStatus}"
                }
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
                            echo "Application is listening on port 4200"
                        } catch (Exception e) {
                            attempt++
                            if (attempt % 10 == 0) {
                                echo "Waiting for application... (${attempt}/${maxAttempts})"
                            }
                        }
                    }

                    if (!appStarted) {
                        // Show container logs for debugging
                        try {
                            bat 'docker logs shopfer-container'
                        } catch (Exception e) {
                            echo "Could not retrieve container logs"
                        }
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
                script {
                    // Run Robot Framework tests and capture the exit code
                    def robotResult = bat(
                        script: '''
                            cd robot-tests
                            robot_env\\Scripts\\robot --outputdir . ^
                                                      --variable BROWSER:headlesschrome ^
                                                      --variable URL:http://localhost:4200 ^
                                                      --loglevel INFO ^
                                                      hello.robot
                        ''',
                        returnStatus: true
                    )

                    // Handle different exit codes
                    // Robot Framework exit codes: 0=success, 1-249=failed tests, 250-255=error
                    if (robotResult == 0) {
                        echo "✅ All Robot Framework tests passed!"
                    } else if (robotResult >= 1 && robotResult <= 249) {
                        echo "⚠️  Some Robot Framework tests failed (exit code: ${robotResult}), but continuing pipeline"
                        currentBuild.result = 'UNSTABLE'
                    } else {
                        echo "❌ Robot Framework encountered an error (exit code: ${robotResult})"
                        currentBuild.result = 'UNSTABLE'
                    }

                    // Always show test summary if output.xml exists
                    try {
                        if (fileExists('robot-tests/output.xml')) {
                            echo "📊 Robot Framework test completed - check artifacts for detailed results"
                            bat '''
                                cd robot-tests
                                echo === ROBOT FRAMEWORK TEST SUMMARY ===
                                echo Output file exists: output.xml
                                if exist log.html echo Log file exists: log.html
                                if exist report.html echo Report file exists: report.html
                            '''
                        } else {
                            echo "⚠️ No Robot Framework output.xml file found"
                        }
                    } catch (Exception e) {
                        echo "Could not display test summary: ${e.getMessage()}"
                    }
                }
            }
        }

        stage('Deploy to AKS') {
            when {
                // Only deploy if build is not failed (can be unstable due to test failures)
                not {
                    equals expected: 'FAILURE', actual: currentBuild.result
                }
            }
            environment {
                RESOURCE_GROUP = 'shopferr'
                CLUSTER_NAME = 'shopferr'
                TENANT_ID = 'dbd6664d-4eb9-46eb-99d8-5c43ba153c61'
                ACR_NAME = 'shopferr'
            }

            steps {
                withCredentials([usernamePassword(credentialsId: 'azure-sp', usernameVariable: 'AZURE_CLIENT_ID', passwordVariable: 'AZURE_CLIENT_SECRET')]) {
                    script {
                        try {
                            echo "🚀 Starting deployment to AKS..."

                            // Azure Login
                            bat """
                            az login --service-principal -u ${AZURE_CLIENT_ID} -p ${AZURE_CLIENT_SECRET} --tenant ${TENANT_ID}
                            """

                            // Get AKS Credentials
                            bat """
                            az aks get-credentials --resource-group ${RESOURCE_GROUP} --name ${CLUSTER_NAME} --overwrite-existing
                            """

                            // Test kubectl connectivity
                            bat 'kubectl cluster-info'

                            // Apply Kubernetes manifests
                            bat 'kubectl apply -f service.yaml'
                            bat 'kubectl apply -f configmap.yaml'
                            bat 'kubectl apply -f deployment.yaml'
                            bat "kubectl rollout restart deployment shopfer-app"

                            // Wait for deployment to complete
                            bat 'kubectl rollout status deployment/shopfer-app --timeout=300s'

                            // Get pod status
                            bat 'kubectl get pods -l app=shopferr -o wide'

                            echo "✅ AKS deployment completed successfully"

                        } catch (Exception e) {
                            echo "⚠️ AKS deployment failed: ${e.getMessage()}"

                            // Diagnostic on failure
                            try {
                                bat 'kubectl get pods -l app=shopferr -o wide || echo "No pods found"'
                                bat 'kubectl describe deployment shopferr || echo "No deployment found"'
                                bat 'kubectl get events --sort-by=.metadata.creationTimestamp | tail -10 || echo "No events"'
                            } catch (Exception diagnosticError) {
                                echo "⚠️ Could not retrieve diagnostics: ${diagnosticError.getMessage()}"
                            }

                            throw e // Re-throw to mark pipeline as failed
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                // Publish Robot Framework results
                try {
                    if (fileExists('robot-tests/output.xml')) {
                        echo "📊 Publishing Robot Framework test results..."
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
                        echo "✅ Robot Framework results published"
                    } else {
                        echo "⚠️ No Robot Framework output.xml found"
                    }
                } catch (Exception e) {
                    echo "⚠️ Could not publish Robot Framework results: ${e.getMessage()}"
                }

                // Archive artifacts
                try {
                    if (fileExists('robot-tests')) {
                        archiveArtifacts artifacts: 'robot-tests/**/*.{xml,html,log,png,jpg}', allowEmptyArchive: true, fingerprint: true
                        echo "✅ Test artifacts archived"
                    }
                } catch (Exception e) {
                    echo "⚠️ Could not archive artifacts: ${e.getMessage()}"
                }
            }
        }

        success {
            echo '🎉 Pipeline completed successfully ✅'
            echo 'Application is running at http://localhost:4200'

            script {
                try {
                    bat '''
                        echo === SUCCESS SUMMARY ===
                        docker ps --filter "name=shopfer-container" --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"
                        kubectl get pods -l app=shopferr -o wide 2>nul || echo "AKS deployment status unknown"
                    '''
                } catch (Exception e) {
                    echo "Could not display success summary"
                }
            }
        }

        unstable {
            echo '⚠️  Pipeline completed with warnings (some tests failed) ⚠️'
            echo 'Application deployment continued despite test failures'
            echo 'Review the Robot Framework test results for details'
        }

        failure {
            echo '❌ Pipeline failed ❌'

            script {
                try {
                    bat '''
                        echo === FAILURE DIAGNOSTIC ===
                        echo "Docker containers:"
                        docker ps -a --filter "name=shopfer" --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}" 2>nul || echo "No shopfer containers"

                        echo "Port 4200 status:"
                        netstat -an | find "4200" 2>nul || echo "Port 4200 not in use"

                        echo "Container logs (last 20 lines):"
                        docker logs --tail 20 shopfer-container 2>nul || echo "No container logs available"

                        echo "Robot test results:"
                        if exist robot-tests\\output.xml echo "Robot test results available" else echo "No robot test results"

                        echo "AKS status:"
                        kubectl get pods -l app=shopferr 2>nul || echo "Cannot connect to AKS or no shopferr pods"
                    '''
                } catch (Exception e) {
                    echo "Diagnostic failed but continuing..."
                }

                // Only cleanup on failure
                try {
                    bat '''
                        echo "Cleaning up failed containers..."
                        docker stop shopfer-container 2>nul || echo "Container already stopped"
                        docker rm shopfer-container 2>nul || echo "Container already removed"
                        for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| find ":4200" ^| find "LISTENING"') do (
                            taskkill /f /pid %%a 2^>nul || echo "Process cleanup"
                        )
                    '''
                } catch (Exception e) {
                    echo "Cleanup completed with warnings"
                }
            }
        }
    }
}
