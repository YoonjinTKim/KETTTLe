## ARC (Advanced Research Computing)

### Getting Started

Make sure you have `FastViromeExplorer` installed on your login node.

```bash
$ git clone https://code.vt.edu/saima5/FastViromeExplorer.git
```

Then, include the `kallisto` and `samtools` dependencies to your `$PATH` environment variable.
You can simply write it your `bash` config file so you don't have to do this every time.
```bash
$ echo "export PATH=\$PATH:/home/<PID>/FastViromeExplorer/tools-linux" > ~/.bashrc
```


### Documentation

Once you have access to ARC, you'll need to know some commands to be able to run jobs and view its progress/output.
The job management is controlled by `qsub` which is used often in high performance computers. To specify all the commands for a job
you have to write a `pbs` (Portable Batch System) file with the bash shebang.

#### Submitting a job

A simple `pbs` file that will print "Hello world".
```
-- helloworld.pbs --
#!/bin/bash
echo "Hello world"
```

The file will be passed as a command line argument, in addition to other necessary parameters.
```bash
$ qsub -A cs4884s18 -q p100_dev_q -W group_list=newriver helloworld.pbs
```

- `-A` specifies the specific allocation, we are using the CS 4884 spring 2018 allocation (make sure Dr. Zhang has added you to the allocation before using this)
- `-q` specifies the specific job queue to use
- `-W` specifies the cluster (we'll be using `newriver`)

There are 7 queues available on the `newriver` cluster:

- `normal_q` for production (research) runs.
- `largemem_q` for production (research) runs on the large memory nodes.
- `dev_q` for short testing, debugging, and interactive sessions. dev_q provides slightly elevated job priority to facilitate code development and job testing prior to production runs.
- `vis_q` for interactive visualization on the GPU nodes.
- `open_q` provides access for small jobs and evaluating system features. open_q does not require an allocation; it can be used by new users or researchers evaluating system performance for an allocation request.
- `p100_normal_q` for production (research) runs on the P100 GPU nodes.
- `p100_dev_q` for short testing, debugging, and interactive sessions on the P100 GPU nodes. p100_dev_q provides slightly elevated job priority to facilitate code development and job testing prior to production runs.

After running the `qsub` command, it will output with the corresponding job id. It will be in the format of `JOB_ID.master.cluster`

#### Job Status

To check the status of the job, you will have to use the job id.

```bash
$ checkjob -v JOB_ID
```

To view all jobs running, you can use
```bash
$ showq -r
```

All data sent to STDOUT and STDERR will be redirected to either `.o` or `.e` files (output and error, respectively). Any files and/or directories created from the job can
be visible in the login node.